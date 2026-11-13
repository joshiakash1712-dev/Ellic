import {
  AuditLog,
  CustomerOrder,
  CustomerProfile,
  POSInvoice,
  Product,
  RestockOrder,
  WebSocketParty,
  WebSocketRoomPresence,
  WebSocketSyncStatus,
  WholesalerProduct
} from '../types';
import { InsufficientStockError } from './firestoreSync';

export interface InventoryJoinParams {
  mode: 'demo' | 'live';
  storeId: string;
  party: WebSocketParty;
  getIdToken?: () => Promise<string | null>;
  getInitialState?: () => {
    products?: Product[];
    wholesalerProducts?: WholesalerProduct[];
    restockOrders?: RestockOrder[];
    customerOrders?: CustomerOrder[];
  };
}

export interface InventorySnapshotPayload {
  roomKey: string;
  mode: 'demo' | 'live';
  storeId: string;
  version: number;
  products: Product[];
  wholesalerProducts: WholesalerProduct[];
  restockOrders: RestockOrder[];
  customerOrders: CustomerOrder[];
  presence: WebSocketRoomPresence;
}

export interface InventoryDeltaPayload {
  roomKey: string;
  mode: 'demo' | 'live';
  storeId: string;
  version: number;
  eventId: string;
  source: string;
  updatedProducts: Product[];
  removedProductIds: string[];
}

export interface InventorySocketListeners {
  onStatusChange?: (status: WebSocketSyncStatus) => void;
  onPresence?: (presence: WebSocketRoomPresence) => void;
  onSnapshot?: (snapshot: InventorySnapshotPayload) => void;
  onDelta?: (delta: InventoryDeltaPayload) => void;
  onRestockOrderUpdated?: (order: RestockOrder, version: number) => void;
  onCustomerOrderUpdated?: (order: CustomerOrder, version: number) => void;
  onInvoiceSynced?: (payload: {
    invoice: POSInvoice;
    customer?: CustomerProfile;
    auditLog?: AuditLog;
    version: number;
  }) => void;
  onWholesalerCatalogDelta?: (products: WholesalerProduct[], version: number) => void;
  onAuthoritativeProductsSync?: (products: Product[]) => void;
}

interface PendingMutation {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface QueuedMessage {
  type: string;
  payload: Record<string, any>;
  requestId: string;
}

export class InventorySocketClient {
  private ws: WebSocket | null = null;
  private status: WebSocketSyncStatus = 'disconnected';
  private joinParams: InventoryJoinParams | null = null;
  private listeners: InventorySocketListeners = {};
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isJoined = false;
  private manuallyClosed = false;
  private pendingMutations = new Map<string, PendingMutation>();
  private queuedOfflineMutations: QueuedMessage[] = [];
  private seenEventIds = new Set<string>();

  public setListeners(listeners: InventorySocketListeners): void {
    this.listeners = listeners;
  }

  public getStatus(): WebSocketSyncStatus {
    return this.status;
  }

  public isReady(): boolean {
    return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN && this.isJoined);
  }

  private setStatus(next: WebSocketSyncStatus): void {
    if (this.status === next) return;
    this.status = next;
    this.listeners.onStatusChange?.(next);
  }

  private getWsUrl(): string {
    if (typeof window === 'undefined') return 'ws://localhost:3000/ws/inventory';
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/inventory`;
  }

  public async connect(params: InventoryJoinParams): Promise<void> {
    const prev = this.joinParams;
    this.joinParams = params;
    this.manuallyClosed = false;

    const sameRoom =
      prev &&
      prev.mode === params.mode &&
      prev.storeId === params.storeId &&
      prev.party === params.party;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (sameRoom && this.isJoined) return;
      this.isJoined = false;
      await this.sendJoin();
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.openSocket();
  }

  public disconnect(): void {
    this.manuallyClosed = true;
    this.isJoined = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnected');
      } catch {
        // ignore close errors
      }
      this.ws = null;
    }
    this.rejectAllPending(new Error('WebSocket disconnected'));
    this.setStatus('disconnected');
  }

  private rejectAllPending(err: Error): void {
    for (const [reqId, pending] of this.pendingMutations.entries()) {
      clearTimeout(pending.timer);
      pending.reject(err);
      this.pendingMutations.delete(reqId);
    }
  }

  private openSocket(): void {
    if (typeof WebSocket === 'undefined') return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const socket = new WebSocket(this.getWsUrl());
      this.ws = socket;

      socket.onopen = async () => {
        if (this.ws !== socket) return;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        await this.sendJoin();
      };

      socket.onmessage = event => {
        if (this.ws !== socket) return;
        this.handleMessage(event.data);
      };

      socket.onerror = () => {
        // onclose handles reconnect backoff
      };

      socket.onclose = () => {
        if (this.ws !== socket) return;
        this.ws = null;
        this.isJoined = false;
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        this.rejectAllPending(new Error('WEBSOCKET_CLOSED'));
        if (!this.manuallyClosed && this.joinParams) {
          this.scheduleReconnect();
        } else {
          this.setStatus('disconnected');
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 20000);
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed || this.reconnectTimer || !this.joinParams) return;
    const delay = Math.min(10000, 500 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;
    this.setStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.manuallyClosed && this.joinParams) {
        this.openSocket();
      }
    }, delay);
  }

  private async sendJoin(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.joinParams) return;
    let idToken: string | null = null;
    if (this.joinParams.mode === 'live' && this.joinParams.getIdToken) {
      try {
        idToken = await this.joinParams.getIdToken();
      } catch {
        idToken = null;
      }
    }
    const initialState = this.joinParams.getInitialState?.();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: 'join',
        mode: this.joinParams.mode,
        storeId: this.joinParams.storeId,
        party: this.joinParams.party,
        idToken: idToken || undefined,
        initialState
      })
    );
  }

  private markEventSeen(eventId?: string): boolean {
    if (!eventId) return false;
    if (this.seenEventIds.has(eventId)) return true;
    this.seenEventIds.add(eventId);
    if (this.seenEventIds.size > 300) {
      const oldest = this.seenEventIds.values().next().value;
      if (oldest) this.seenEventIds.delete(oldest);
    }
    return false;
  }

  private flushQueuedOfflineMutations(): void {
    if (!this.isReady() || this.queuedOfflineMutations.length === 0) return;
    const toFlush = [...this.queuedOfflineMutations];
    this.queuedOfflineMutations = [];
    for (const item of toFlush) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: item.type,
            requestId: item.requestId,
            ...item.payload
          })
        );
      }
    }
  }

  private handleMessage(rawData: any): void {
    let msg: Record<string, any>;
    try {
      msg = JSON.parse(String(rawData));
    } catch {
      return;
    }

    if (msg.type === 'pong') return;

    if (msg.type === 'inventory:snapshot') {
      this.isJoined = true;
      this.setStatus('connected');
      this.listeners.onSnapshot?.(msg as InventorySnapshotPayload);
      this.flushQueuedOfflineMutations();
      return;
    }

    if (msg.type === 'room:presence') {
      this.listeners.onPresence?.(msg.presence as WebSocketRoomPresence);
      return;
    }

    if (msg.type === 'inventory:delta') {
      if (this.markEventSeen(msg.eventId)) return;
      this.listeners.onDelta?.(msg as InventoryDeltaPayload);
      return;
    }

    if (msg.type === 'restock:updated') {
      if (this.markEventSeen(msg.eventId)) return;
      this.listeners.onRestockOrderUpdated?.(msg.order as RestockOrder, Number(msg.version || 0));
      return;
    }

    if (msg.type === 'customer_order:updated') {
      if (this.markEventSeen(msg.eventId)) return;
      this.listeners.onCustomerOrderUpdated?.(msg.order as CustomerOrder, Number(msg.version || 0));
      return;
    }

    if (msg.type === 'invoice:synced') {
      if (this.markEventSeen(msg.eventId)) return;
      this.listeners.onInvoiceSynced?.({
        invoice: msg.invoice as POSInvoice,
        customer: msg.customer as CustomerProfile | undefined,
        auditLog: msg.auditLog as AuditLog | undefined,
        version: Number(msg.version || 0)
      });
      return;
    }

    if (msg.type === 'wholesaler_catalog:delta') {
      if (this.markEventSeen(msg.eventId)) return;
      this.listeners.onWholesalerCatalogDelta?.(
        (msg.updatedWholesalerProducts || []) as WholesalerProduct[],
        Number(msg.version || 0)
      );
      return;
    }

    if (msg.type === 'mutation:ack') {
      const pending = this.pendingMutations.get(msg.requestId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingMutations.delete(msg.requestId);
        pending.resolve(msg.data ?? msg);
      }
      return;
    }

    if (msg.type === 'inventory:rejected') {
      if (Array.isArray(msg.authoritativeProducts) && msg.authoritativeProducts.length > 0) {
        this.listeners.onAuthoritativeProductsSync?.(msg.authoritativeProducts as Product[]);
      }
      const err = new InsufficientStockError(msg.message || 'Insufficient stock.', {
        productId: msg.productId,
        availableStock: msg.availableStock,
        requestedQuantity: msg.requestedQuantity
      });
      const pending = this.pendingMutations.get(msg.requestId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingMutations.delete(msg.requestId);
        pending.reject(err);
      }
      return;
    }

    if (msg.type === 'mutation:error' || msg.type === 'error') {
      const err = new Error(msg.message || msg.code || 'Inventory mutation rejected by server.');
      const pending = msg.requestId ? this.pendingMutations.get(msg.requestId) : undefined;
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingMutations.delete(msg.requestId);
        pending.reject(err);
      }
    }
  }

  public sendMutation<T = any>(
    type: string,
    payload: Record<string, any>,
    options?: { queueIfOffline?: boolean; requestId?: string; timeoutMs?: number }
  ): Promise<T> {
    const requestId =
      options?.requestId ||
      `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!this.isReady() || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (options?.queueIfOffline) {
        this.queuedOfflineMutations.push({ type, payload, requestId });
        if (this.queuedOfflineMutations.length > 100) {
          this.queuedOfflineMutations.shift();
        }
        return Promise.resolve({ queued: true } as T);
      }
      return Promise.reject(new Error('WEBSOCKET_OFFLINE'));
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingMutations.delete(requestId);
        reject(new Error('WebSocket mutation timed out.'));
      }, options?.timeoutMs ?? 8000);

      this.pendingMutations.set(requestId, { resolve, reject, timer });

      try {
        this.ws!.send(
          JSON.stringify({
            type,
            requestId,
            ...payload
          })
        );
      } catch (err) {
        clearTimeout(timer);
        this.pendingMutations.delete(requestId);
        reject(err);
      }
    });
  }
}

export const inventorySocket = new InventorySocketClient();
