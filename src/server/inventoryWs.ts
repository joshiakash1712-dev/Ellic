import type { Server as HttpServer } from 'http';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import {
  type CanonicalRole,
  type CustomerOrder,
  type CustomerProfile,
  type POSInvoice,
  type Product,
  type RestockLog,
  type RestockOrder,
  type WebSocketParty,
  type WebSocketRoomPresence,
  type WholesalerProduct,
  type AuditLog,
  normalizeCanonicalRole,
  isUserStatusInactive
} from '../types.ts';

export interface InventoryWsManagerOptions {
  server: HttpServer;
  adminDb: Firestore | null;
  adminAuth: Auth | null;
  path?: string;
  heartbeatIntervalMs?: number;
  allowUnauthenticatedLiveForTests?: boolean;
}

interface RoomClient {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  roomKey: string;
  mode: 'demo' | 'live';
  storeId: string;
  party: WebSocketParty;
  role: CanonicalRole;
  uid?: string;
  email?: string;
  clientId?: string;
  assignedStoreIds?: string[];
  wholesalerId?: string;
}

interface InitialRoomState {
  products?: Product[];
  wholesalerProducts?: WholesalerProduct[];
  restockOrders?: RestockOrder[];
  customerOrders?: CustomerOrder[];
}

interface StoreRoomState {
  roomKey: string;
  mode: 'demo' | 'live';
  storeId: string;
  version: number;
  products: Map<string, Product>;
  wholesalerProducts: Map<string, WholesalerProduct>;
  restockOrders: Map<string, RestockOrder>;
  customerOrders: Map<string, CustomerOrder>;
  processedRequests: Map<string, { payload: any; timestamp: number }>;
  lockQueue: Promise<void>;
  hydratedFromFirestore: boolean;
  clients: Set<RoomClient>;
}

const VALID_PARTIES = new Set<WebSocketParty>(['retailer', 'wholesaler', 'customer', 'admin']);

function isWellFormedJwt(token: string): boolean {
  if (!token || token === 'undefined' || token === 'null') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  return parts.every(part => part.length >= 10 && /^[A-Za-z0-9\-_]+$/.test(part));
}

function sanitizeForFirestore(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (typeof v === 'number') {
      out[k] = Number.isNaN(v) ? 0 : v;
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = sanitizeForFirestore(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function stripPurchasePriceForCustomer(product: Product): Product {
  return {
    ...product,
    purchasePrice: 0
  };
}

function cloneProductForClient(product: Product, client: RoomClient): Product | null {
  if (client.party === 'wholesaler') {
    if (!product.sharedWithWholesalers) return null;
    return { ...product };
  }
  if (client.party === 'customer') {
    return stripPurchasePriceForCustomer(product);
  }
  return { ...product };
}

function sendJson(ws: WebSocket, payload: Record<string, any>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function createInventoryWebSocketManager(options: InventoryWsManagerOptions) {
  const {
    server,
    adminDb,
    adminAuth,
    path = '/ws/inventory',
    heartbeatIntervalMs = 25000,
    allowUnauthenticatedLiveForTests = false
  } = options;

  const wss = new WebSocketServer({ server, path });
  const rooms = new Map<string, StoreRoomState>();

  const getOrCreateRoom = (mode: 'demo' | 'live', storeId: string): StoreRoomState => {
    const cleanStoreId = (storeId || 'store-1').trim() || 'store-1';
    const roomKey = `${mode}:${cleanStoreId}`;
    let room = rooms.get(roomKey);
    if (!room) {
      room = {
        roomKey,
        mode,
        storeId: cleanStoreId,
        version: 1,
        products: new Map(),
        wholesalerProducts: new Map(),
        restockOrders: new Map(),
        customerOrders: new Map(),
        processedRequests: new Map(),
        lockQueue: Promise.resolve(),
        hydratedFromFirestore: false,
        clients: new Set()
      };
      rooms.set(roomKey, room);
    }
    return room;
  };

  const withRoomLock = async <T>(room: StoreRoomState, fn: () => Promise<T>): Promise<T> => {
    const prev = room.lockQueue;
    let release!: () => void;
    room.lockQueue = new Promise<void>(resolve => {
      release = resolve;
    });
    await prev.catch(() => {});
    try {
      return await fn();
    } finally {
      release();
    }
  };

  const recordIdempotentAck = (room: StoreRoomState, requestId: string, ackPayload: any) => {
    room.processedRequests.set(requestId, { payload: ackPayload, timestamp: Date.now() });
    if (room.processedRequests.size > 500) {
      const oldestKey = room.processedRequests.keys().next().value;
      if (oldestKey) room.processedRequests.delete(oldestKey);
    }
  };

  const computePresence = (room: StoreRoomState): WebSocketRoomPresence => {
    const presence: WebSocketRoomPresence = {
      retailer: 0,
      wholesaler: 0,
      customer: 0,
      admin: 0,
      total: 0
    };
    for (const c of room.clients) {
      if (c.ws.readyState !== WebSocket.OPEN) continue;
      presence[c.party] += 1;
      presence.total += 1;
    }
    return presence;
  };

  const broadcastPresence = (room: StoreRoomState) => {
    const presence = computePresence(room);
    for (const c of room.clients) {
      sendJson(c.ws, {
        type: 'room:presence',
        storeId: room.storeId,
        mode: room.mode,
        version: room.version,
        presence
      });
    }
  };

  const buildSnapshotForClient = (room: StoreRoomState, client: RoomClient) => {
    const products: Product[] = [];
    for (const p of room.products.values()) {
      const scoped = cloneProductForClient(p, client);
      if (scoped) products.push(scoped);
    }

    const wholesalerProducts =
      client.party === 'customer' ? [] : Array.from(room.wholesalerProducts.values());

    const restockOrders =
      client.party === 'customer' ? [] : Array.from(room.restockOrders.values());

    let customerOrders = Array.from(room.customerOrders.values());
    if (client.party === 'wholesaler') {
      customerOrders = [];
    } else if (client.party === 'customer' && room.mode === 'live' && client.uid) {
      customerOrders = customerOrders.filter(
        co => !co.customerId || co.customerId === client.uid || co.customerId === 'cust-1'
      );
    }

    return {
      type: 'inventory:snapshot',
      roomKey: room.roomKey,
      mode: room.mode,
      storeId: room.storeId,
      version: room.version,
      products,
      wholesalerProducts,
      restockOrders,
      customerOrders,
      presence: computePresence(room)
    };
  };

  const broadcastInventoryDelta = (
    room: StoreRoomState,
    params: {
      source: string;
      eventId: string;
      updatedProducts?: Product[];
      removedProductIds?: string[];
      unsharedProductIds?: string[];
    }
  ) => {
    const updatedProducts = params.updatedProducts || [];
    const baseRemovedIds = params.removedProductIds || [];
    const unsharedIds = params.unsharedProductIds || [];

    for (const c of room.clients) {
      if (c.ws.readyState !== WebSocket.OPEN) continue;

      const scopedProducts: Product[] = [];
      for (const p of updatedProducts) {
        const scoped = cloneProductForClient(p, c);
        if (scoped) scopedProducts.push(scoped);
      }

      const removedForClient =
        c.party === 'wholesaler'
          ? Array.from(new Set([...baseRemovedIds, ...unsharedIds]))
          : baseRemovedIds;

      if (scopedProducts.length === 0 && removedForClient.length === 0) {
        continue;
      }

      sendJson(c.ws, {
        type: 'inventory:delta',
        roomKey: room.roomKey,
        mode: room.mode,
        storeId: room.storeId,
        version: room.version,
        eventId: params.eventId,
        source: params.source,
        updatedProducts: scopedProducts,
        removedProductIds: removedForClient
      });
    }
  };

  const broadcastEvent = (
    room: StoreRoomState,
    eventPayload: Record<string, any>,
    filterClient?: (client: RoomClient) => boolean
  ) => {
    for (const c of room.clients) {
      if (c.ws.readyState !== WebSocket.OPEN) continue;
      if (filterClient && !filterClient(c)) continue;
      sendJson(c.ws, eventPayload);
    }
  };

  const hydrateRoomFromFirestore = async (room: StoreRoomState) => {
    if (room.mode !== 'live' || !adminDb || room.hydratedFromFirestore) return;
    try {
      const storeRef = adminDb.collection('stores').doc(room.storeId);
      const [prodSnap, restockSnap, customerOrderSnap] = await Promise.all([
        storeRef.collection('products').get(),
        storeRef.collection('restockOrders').get(),
        storeRef.collection('customerOrders').get()
      ]);

      if (!prodSnap.empty) {
        room.products.clear();
        prodSnap.forEach(docSnap => {
          const data = docSnap.data() as Product;
          room.products.set(docSnap.id, { ...data, id: docSnap.id, storeId: room.storeId });
        });
      }
      if (!restockSnap.empty) {
        room.restockOrders.clear();
        restockSnap.forEach(docSnap => {
          const data = docSnap.data() as RestockOrder;
          room.restockOrders.set(docSnap.id, { ...data, id: docSnap.id });
        });
      }
      if (!customerOrderSnap.empty) {
        room.customerOrders.clear();
        customerOrderSnap.forEach(docSnap => {
          const data = docSnap.data() as CustomerOrder;
          room.customerOrders.set(docSnap.id, { ...data, id: docSnap.id });
        });
      }
      room.hydratedFromFirestore = true;
    } catch {
      // Firestore Admin credentials may not be present in local dev; fallback to in-memory room ledger
    }
  };

  const seedRoomIfEmpty = (room: StoreRoomState, initialState?: InitialRoomState) => {
    if (!initialState) return;
    if (room.products.size === 0 && Array.isArray(initialState.products)) {
      for (const p of initialState.products) {
        if (p?.id) {
          room.products.set(p.id, { ...p, storeId: p.storeId || room.storeId });
        }
      }
    }
    if (room.wholesalerProducts.size === 0 && Array.isArray(initialState.wholesalerProducts)) {
      for (const wp of initialState.wholesalerProducts) {
        if (wp?.id) {
          room.wholesalerProducts.set(wp.id, { ...wp });
        }
      }
    }
    if (room.restockOrders.size === 0 && Array.isArray(initialState.restockOrders)) {
      for (const ro of initialState.restockOrders) {
        if (ro?.id) {
          room.restockOrders.set(ro.id, { ...ro });
        }
      }
    }
    if (room.customerOrders.size === 0 && Array.isArray(initialState.customerOrders)) {
      for (const co of initialState.customerOrders) {
        if (co?.id) {
          room.customerOrders.set(co.id, { ...co });
        }
      }
    }
  };

  const verifyLiveJoinCaller = async (params: {
    idToken?: string;
    requestedParty: WebSocketParty;
    storeId: string;
  }): Promise<{
    ok: true;
    uid?: string;
    email?: string;
    role: CanonicalRole;
    party: WebSocketParty;
    clientId?: string;
    assignedStoreIds?: string[];
    wholesalerId?: string;
  } | { ok: false; code: string; message: string }> => {
    const { idToken, requestedParty, storeId } = params;

    if (!idToken) {
      if (allowUnauthenticatedLiveForTests) {
        return {
          ok: true,
          role: requestedParty === 'wholesaler' ? 'wholesaler_admin' : requestedParty === 'customer' ? 'customer' : 'client',
          party: requestedParty
        };
      }
      return { ok: false, code: 'UNAUTHORIZED', message: 'Authentication token required for live inventory sync.' };
    }

    if (!adminAuth) {
      if (allowUnauthenticatedLiveForTests) {
        return {
          ok: true,
          role: requestedParty === 'wholesaler' ? 'wholesaler_admin' : requestedParty === 'customer' ? 'customer' : 'client',
          party: requestedParty
        };
      }
      return { ok: false, code: 'AUTH_UNAVAILABLE', message: 'Authentication service unavailable.' };
    }

    if (!isWellFormedJwt(idToken)) {
      return { ok: false, code: 'UNAUTHORIZED', message: 'Malformed authentication token.' };
    }

    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      let rawRole: unknown = decoded.role;
      let clientId: string | undefined = (decoded as any).clientId || (decoded as any).client_id;
      let assignedStoreIds: string[] = Array.isArray((decoded as any).assignedStoreIds)
        ? (decoded as any).assignedStoreIds
        : [];
      let wholesalerId: string | undefined = (decoded as any).wholesalerId;
      let inactive = false;

      if (adminDb) {
        try {
          const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
          if (userSnap.exists) {
            const data = userSnap.data() || {};
            if (isUserStatusInactive(data)) inactive = true;
            if (data.role !== undefined) rawRole = data.role;
            clientId = data.clientId || data.client_id || clientId;
            if (Array.isArray(data.assignedStoreIds)) assignedStoreIds = data.assignedStoreIds;
            wholesalerId = data.wholesalerId || wholesalerId;
          }
        } catch {
          // ignore Firestore lookup issues when ADC isn't configured locally
        }
      }

      if (inactive) {
        return { ok: false, code: 'FORBIDDEN', message: 'Account is disabled or inactive.' };
      }

      const email = decoded.email?.toLowerCase();
      const role: CanonicalRole =
        email === 'ellixorrr@gmail.com'
          ? 'super_admin'
          : email === 'ellic.admin11@gmail.com'
          ? 'ellix_admin'
          : normalizeCanonicalRole(rawRole || 'customer');

      if (role === 'unauthorized' || role === 'ellix_admin') {
        return { ok: false, code: 'FORBIDDEN', message: 'Current role cannot subscribe to store inventory rooms.' };
      }

      if (role === 'crew' && assignedStoreIds.length > 0 && !assignedStoreIds.includes(storeId)) {
        return { ok: false, code: 'FORBIDDEN', message: `Crew member is not assigned to store ${storeId}.` };
      }

      let effectiveParty: WebSocketParty = requestedParty;
      if (role === 'customer') effectiveParty = 'customer';
      else if (role === 'wholesaler_admin') effectiveParty = 'wholesaler';
      else if (role === 'crew') effectiveParty = 'retailer';
      else if (role === 'client') effectiveParty = requestedParty === 'customer' ? 'customer' : 'retailer';

      return {
        ok: true,
        uid: decoded.uid,
        email: decoded.email,
        role,
        party: effectiveParty,
        clientId,
        assignedStoreIds,
        wholesalerId
      };
    } catch {
      return { ok: false, code: 'UNAUTHORIZED', message: 'Invalid or expired authentication token.' };
    }
  };

  const handleMutation = async (client: RoomClient, msg: Record<string, any>) => {
    const room = rooms.get(client.roomKey);
    if (!room) {
      sendJson(client.ws, {
        type: 'mutation:error',
        requestId: msg.requestId,
        code: 'NOT_JOINED',
        message: 'Join a store room before emitting inventory mutations.'
      });
      return;
    }

    const requestId = typeof msg.requestId === 'string' && msg.requestId.trim()
      ? msg.requestId.trim()
      : `req-${crypto.randomUUID()}`;

    await withRoomLock(room, async () => {
      // Idempotency guard for retries / reconnect replays
      const cached = room.processedRequests.get(requestId);
      if (cached) {
        sendJson(client.ws, {
          type: 'mutation:ack',
          requestId,
          idempotentReplay: true,
          ...cached.payload
        });
        return;
      }

      const eventId = `evt-${crypto.randomUUID()}`;

      switch (msg.type) {
        case 'room:reset': {
          if (room.mode !== 'demo') {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Room reset is only permitted in Demo Mode.'
            });
            return;
          }
          const initialState = (msg.initialState || {}) as InitialRoomState;
          room.products.clear();
          room.wholesalerProducts.clear();
          room.restockOrders.clear();
          room.customerOrders.clear();
          room.processedRequests.clear();
          seedRoomIfEmpty(room, initialState);
          room.version += 1;

          const ackData = { ok: true, version: room.version };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });
          for (const c of room.clients) {
            sendJson(c.ws, buildSnapshotForClient(room, c));
          }
          return;
        }

        case 'pos:sale': {
          if (room.mode === 'live' && !['retailer', 'admin'].includes(client.party)) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Only store retailers or admins can process POS sales.'
            });
            return;
          }

          const invoice = msg.invoice as POSInvoice | undefined;
          const customer = msg.customer as CustomerProfile | undefined;
          const auditLog = msg.auditLog as AuditLog | undefined;

          if (!invoice || !Array.isArray(invoice.items) || invoice.items.length === 0) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'INVALID_PAYLOAD',
              message: 'Invoice items are required.'
            });
            return;
          }

          if (room.mode === 'live' && client.role === 'crew') {
            const hasDiscount =
              Number(invoice.discountTotal || 0) > 0 ||
              Number(invoice.discountAmount || 0) > 0 ||
              Number(invoice.discountPercent || 0) > 0 ||
              invoice.items.some(it => Number(it.discount || 0) > 0);
            if (hasDiscount || Number(invoice.loyaltyPointsRedeemed || 0) > 0) {
              sendJson(client.ws, {
                type: 'mutation:error',
                requestId,
                code: 'FORBIDDEN',
                message: 'Crew members are not authorized to apply discounts or redeem points.'
              });
              return;
            }
          }

          const requestedByProduct = new Map<string, { qty: number; name: string }>();
          for (const item of invoice.items) {
            const qty = Number(item.quantity);
            if (!Number.isFinite(qty) || qty <= 0) {
              sendJson(client.ws, {
                type: 'mutation:error',
                requestId,
                code: 'INVALID_QUANTITY',
                message: `Invalid quantity (${item.quantity}) for ${item.productName || item.productId}.`
              });
              return;
            }
            const prev = requestedByProduct.get(item.productId);
            requestedByProduct.set(item.productId, {
              qty: (prev?.qty || 0) + qty,
              name: item.productName || prev?.name || item.productId
            });
          }

          // Authoritative stock check against room ledger
          for (const [productId, req] of requestedByProduct.entries()) {
            const currentProd = room.products.get(productId);
            const available = currentProd ? Math.max(0, Number(currentProd.stock ?? 0)) : 0;
            if (!currentProd || available < req.qty) {
              sendJson(client.ws, {
                type: 'inventory:rejected',
                requestId,
                code: 'INSUFFICIENT_STOCK',
                productId,
                availableStock: available,
                requestedQuantity: req.qty,
                message: `Insufficient stock for "${currentProd?.name || req.name}": only ${available} available, requested ${req.qty}.`,
                authoritativeProducts: currentProd ? [cloneProductForClient(currentProd, client)].filter(Boolean) : []
              });
              return;
            }
          }

          // Live Firestore transaction if available & hydrated
          let firestoreTxCommitted = false;
          if (room.mode === 'live' && adminDb && room.hydratedFromFirestore) {
            try {
              const storeRef = adminDb.collection('stores').doc(room.storeId);
              await adminDb.runTransaction(async tx => {
                const entries = Array.from(requestedByProduct.entries());
                const prodRefs = entries.map(([pid]) => storeRef.collection('products').doc(pid));
                const prodSnaps = await Promise.all(prodRefs.map(r => tx.get(r)));
                const invRef = storeRef.collection('invoices').doc(invoice.id);
                const invSnap = await tx.get(invRef);
                if (invSnap.exists) {
                  firestoreTxCommitted = true;
                  return;
                }

                for (let i = 0; i < entries.length; i++) {
                  const [pid, req] = entries[i];
                  const snap = prodSnaps[i];
                  if (snap.exists) {
                    const data = snap.data() as Product;
                    const cloudStock = Math.max(0, Number(data.stock ?? 0));
                    if (cloudStock < req.qty) {
                      const err: any = new Error(
                        `Insufficient stock for "${data.name || req.name}": only ${cloudStock} available, requested ${req.qty}.`
                      );
                      err.code = 'INSUFFICIENT_STOCK';
                      err.productId = pid;
                      err.availableStock = cloudStock;
                      err.requestedQuantity = req.qty;
                      throw err;
                    }
                    const nextStock = cloudStock - req.qty;
                    tx.set(prodRefs[i], { stock: nextStock, updatedAt: new Date().toISOString() }, { merge: true });
                    const existingLocal = room.products.get(pid);
                    room.products.set(pid, { ...(existingLocal || data), id: pid, stock: nextStock });
                  }
                }

                tx.set(invRef, sanitizeForFirestore({ ...invoice, storeId: room.storeId }), { merge: true });
                if (customer?.id) {
                  tx.set(
                    storeRef.collection('customers').doc(customer.id),
                    sanitizeForFirestore({ ...customer, storeId: room.storeId }),
                    { merge: true }
                  );
                }
                if (auditLog?.id) {
                  tx.set(
                    storeRef.collection('auditLogs').doc(auditLog.id),
                    sanitizeForFirestore({ ...auditLog, storeId: room.storeId }),
                    { merge: true }
                  );
                }
              });
              firestoreTxCommitted = true;
            } catch (err: any) {
              if (err?.code === 'INSUFFICIENT_STOCK') {
                if (err.productId && typeof err.availableStock === 'number') {
                  const existing = room.products.get(err.productId);
                  if (existing) {
                    room.products.set(err.productId, { ...existing, stock: err.availableStock });
                  }
                }
                sendJson(client.ws, {
                  type: 'inventory:rejected',
                  requestId,
                  code: 'INSUFFICIENT_STOCK',
                  productId: err.productId,
                  availableStock: err.availableStock,
                  requestedQuantity: err.requestedQuantity,
                  message: err.message
                });
                return;
              }
              // Otherwise fall back to room ledger update if Firestore ADC unavailable
            }
          }

          // Commit deduction in authoritative room ledger (only if Firestore transaction did not already apply it)
          const updatedProducts: Product[] = [];
          for (const [productId, req] of requestedByProduct.entries()) {
            const currentProd = room.products.get(productId);
            if (!currentProd) continue;
            if (firestoreTxCommitted) {
              updatedProducts.push(currentProd);
            } else {
              const nextStock = Math.max(0, Number(currentProd.stock) - req.qty);
              const nextProd: Product = { ...currentProd, stock: nextStock };
              room.products.set(productId, nextProd);
              updatedProducts.push(nextProd);
            }
          }

          room.version += 1;
          const ackData = {
            ok: true,
            version: room.version,
            data: { invoice, updatedProducts }
          };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });

          broadcastInventoryDelta(room, {
            source: 'pos:sale',
            eventId,
            updatedProducts
          });

          broadcastEvent(
            room,
            {
              type: 'invoice:synced',
              storeId: room.storeId,
              version: room.version,
              eventId,
              invoice,
              customer,
              auditLog
            },
            c => c.party === 'retailer' || c.party === 'admin'
          );
          return;
        }

        case 'customer:order_create': {
          if (room.mode === 'live' && !['customer', 'retailer', 'admin'].includes(client.party)) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Not authorized to place customer orders.'
            });
            return;
          }

          const order = msg.order as CustomerOrder | undefined;
          if (!order || !order.id || !Array.isArray(order.items) || order.items.length === 0) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'INVALID_PAYLOAD',
              message: 'Customer order items are required.'
            });
            return;
          }

          // Idempotent duplicate order guard
          const existingOrder = room.customerOrders.get(order.id);
          if (existingOrder) {
            const ackData = {
              ok: true,
              version: room.version,
              data: { order: existingOrder, updatedProducts: [] }
            };
            recordIdempotentAck(room, requestId, ackData);
            sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });
            return;
          }

          const requestedByProduct = new Map<string, { qty: number; name: string }>();
          for (const item of order.items) {
            const qty = Number(item.quantity);
            if (!Number.isFinite(qty) || qty <= 0) {
              sendJson(client.ws, {
                type: 'mutation:error',
                requestId,
                code: 'INVALID_QUANTITY',
                message: `Invalid quantity (${item.quantity}) for ${item.productName || item.productId}.`
              });
              return;
            }
            const prev = requestedByProduct.get(item.productId);
            requestedByProduct.set(item.productId, {
              qty: (prev?.qty || 0) + qty,
              name: item.productName || prev?.name || item.productId
            });
          }

          for (const [productId, req] of requestedByProduct.entries()) {
            const currentProd = room.products.get(productId);
            const available = currentProd ? Math.max(0, Number(currentProd.stock ?? 0)) : 0;
            if (!currentProd || available < req.qty) {
              sendJson(client.ws, {
                type: 'inventory:rejected',
                requestId,
                code: 'INSUFFICIENT_STOCK',
                productId,
                availableStock: available,
                requestedQuantity: req.qty,
                message: `Insufficient stock for "${currentProd?.name || req.name}": only ${available} available, requested ${req.qty}.`,
                authoritativeProducts: currentProd ? [cloneProductForClient(currentProd, client)].filter(Boolean) : []
              });
              return;
            }
          }

          const committedOrder: CustomerOrder = {
            ...order,
            storeId: room.storeId,
            stockReserved: true
          };

          let firestoreTxCommitted = false;
          if (room.mode === 'live' && adminDb && room.hydratedFromFirestore) {
            try {
              const storeRef = adminDb.collection('stores').doc(room.storeId);
              await adminDb.runTransaction(async tx => {
                const entries = Array.from(requestedByProduct.entries());
                const prodRefs = entries.map(([pid]) => storeRef.collection('products').doc(pid));
                const prodSnaps = await Promise.all(prodRefs.map(r => tx.get(r)));
                for (let i = 0; i < entries.length; i++) {
                  const [pid, req] = entries[i];
                  const snap = prodSnaps[i];
                  if (snap.exists) {
                    const data = snap.data() as Product;
                    const cloudStock = Math.max(0, Number(data.stock ?? 0));
                    if (cloudStock < req.qty) {
                      const err: any = new Error(
                        `Insufficient stock for "${data.name || req.name}": only ${cloudStock} available, requested ${req.qty}.`
                      );
                      err.code = 'INSUFFICIENT_STOCK';
                      err.productId = pid;
                      err.availableStock = cloudStock;
                      err.requestedQuantity = req.qty;
                      throw err;
                    }
                    const nextStock = cloudStock - req.qty;
                    tx.set(prodRefs[i], { stock: nextStock, updatedAt: new Date().toISOString() }, { merge: true });
                    const existingLocal = room.products.get(pid);
                    room.products.set(pid, { ...(existingLocal || data), id: pid, stock: nextStock });
                  }
                }
                tx.set(
                  storeRef.collection('customerOrders').doc(committedOrder.id),
                  sanitizeForFirestore(committedOrder),
                  { merge: true }
                );
              });
              firestoreTxCommitted = true;
            } catch (err: any) {
              if (err?.code === 'INSUFFICIENT_STOCK') {
                if (err.productId && typeof err.availableStock === 'number') {
                  const existing = room.products.get(err.productId);
                  if (existing) {
                    room.products.set(err.productId, { ...existing, stock: err.availableStock });
                  }
                }
                sendJson(client.ws, {
                  type: 'inventory:rejected',
                  requestId,
                  code: 'INSUFFICIENT_STOCK',
                  productId: err.productId,
                  availableStock: err.availableStock,
                  requestedQuantity: err.requestedQuantity,
                  message: err.message
                });
                return;
              }
            }
          }

          const updatedProducts: Product[] = [];
          for (const [productId, req] of requestedByProduct.entries()) {
            const currentProd = room.products.get(productId);
            if (!currentProd) continue;
            if (firestoreTxCommitted) {
              updatedProducts.push(currentProd);
            } else {
              const nextStock = Math.max(0, Number(currentProd.stock) - req.qty);
              const nextProd: Product = { ...currentProd, stock: nextStock };
              room.products.set(productId, nextProd);
              updatedProducts.push(nextProd);
            }
          }

          room.customerOrders.set(committedOrder.id, committedOrder);
          room.version += 1;

          const scopedUpdated = updatedProducts.map(p => cloneProductForClient(p, client)).filter(Boolean);
          const ackData = {
            ok: true,
            version: room.version,
            data: { order: committedOrder, updatedProducts: scopedUpdated }
          };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });

          broadcastInventoryDelta(room, {
            source: 'customer:order_create',
            eventId,
            updatedProducts
          });

          broadcastEvent(
            room,
            {
              type: 'customer_order:updated',
              storeId: room.storeId,
              version: room.version,
              eventId,
              order: committedOrder
            },
            c =>
              c.party === 'retailer' ||
              c.party === 'admin' ||
              (c.party === 'customer' &&
                (room.mode === 'demo' || !c.uid || committedOrder.customerId === c.uid || committedOrder.customerId === 'cust-1'))
          );
          return;
        }

        case 'customer:order_status': {
          const orderId = String(msg.orderId || '');
          const nextStatus = msg.status as CustomerOrder['orderStatus'];
          const existing = room.customerOrders.get(orderId);
          if (!existing) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'NOT_FOUND',
              message: `Customer order ${orderId} not found.`
            });
            return;
          }

          if (
            room.mode === 'live' &&
            client.party === 'customer' &&
            (nextStatus !== 'cancelled' || (client.uid && existing.customerId !== client.uid))
          ) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Customers can only cancel their own orders.'
            });
            return;
          }

          const shouldRestoreStock =
            nextStatus === 'cancelled' &&
            existing.orderStatus !== 'cancelled' &&
            existing.stockReserved !== false;

          const updatedProducts: Product[] = [];
          if (shouldRestoreStock) {
            for (const item of existing.items) {
              const currentProd = room.products.get(item.productId);
              if (!currentProd) continue;
              const nextStock = Math.max(0, Number(currentProd.stock) + Number(item.quantity || 0));
              const nextProd: Product = { ...currentProd, stock: nextStock };
              room.products.set(item.productId, nextProd);
              updatedProducts.push(nextProd);
            }
          }

          const updatedOrder: CustomerOrder = {
            ...existing,
            orderStatus: nextStatus,
            stockReserved: shouldRestoreStock ? false : existing.stockReserved
          };
          room.customerOrders.set(orderId, updatedOrder);

          if (room.mode === 'live' && adminDb) {
            try {
              const storeRef = adminDb.collection('stores').doc(room.storeId);
              await adminDb.runTransaction(async tx => {
                for (const prod of updatedProducts) {
                  tx.set(
                    storeRef.collection('products').doc(prod.id),
                    { stock: prod.stock, updatedAt: new Date().toISOString() },
                    { merge: true }
                  );
                }
                tx.set(
                  storeRef.collection('customerOrders').doc(orderId),
                  sanitizeForFirestore(updatedOrder),
                  { merge: true }
                );
              });
            } catch {
              // ignore ADC unavailability in local environment
            }
          }

          room.version += 1;
          const ackData = {
            ok: true,
            version: room.version,
            data: { order: updatedOrder, updatedProducts }
          };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });

          if (updatedProducts.length > 0) {
            broadcastInventoryDelta(room, {
              source: 'customer:order_cancelled',
              eventId,
              updatedProducts
            });
          }

          broadcastEvent(
            room,
            {
              type: 'customer_order:updated',
              storeId: room.storeId,
              version: room.version,
              eventId,
              order: updatedOrder
            },
            c =>
              c.party === 'retailer' ||
              c.party === 'admin' ||
              (c.party === 'customer' &&
                (room.mode === 'demo' || !c.uid || updatedOrder.customerId === c.uid || updatedOrder.customerId === 'cust-1'))
          );
          return;
        }

        case 'product:upsert': {
          if (room.mode === 'live' && !['retailer', 'admin'].includes(client.party)) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Only store retailers or admins can modify products.'
            });
            return;
          }

          const incoming = msg.product as Product | undefined;
          if (!incoming || !incoming.id) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'INVALID_PAYLOAD',
              message: 'Product object with id is required.'
            });
            return;
          }

          const existing = room.products.get(incoming.id);
          if (room.mode === 'live' && client.role === 'crew' && existing) {
            if (Number(incoming.stock) < Number(existing.stock)) {
              sendJson(client.ws, {
                type: 'mutation:error',
                requestId,
                code: 'FORBIDDEN',
                message: 'Crew cannot manually reduce product stock.'
              });
              return;
            }
          }

          const nextProduct: Product = {
            ...(existing || {}),
            ...incoming,
            storeId: room.storeId,
            stock: Math.max(0, Number(incoming.stock ?? existing?.stock ?? 0)),
            sharedWithWholesalers:
              room.mode === 'live' && client.role === 'crew'
                ? Boolean(existing?.sharedWithWholesalers ?? false)
                : Boolean(incoming.sharedWithWholesalers)
          };

          const wasShared = Boolean(existing?.sharedWithWholesalers);
          const isSharedNow = Boolean(nextProduct.sharedWithWholesalers);
          const unsharedProductIds = wasShared && !isSharedNow ? [nextProduct.id] : [];

          room.products.set(nextProduct.id, nextProduct);

          if (room.mode === 'live' && adminDb) {
            try {
              await adminDb
                .collection('stores')
                .doc(room.storeId)
                .collection('products')
                .doc(nextProduct.id)
                .set(sanitizeForFirestore({ ...nextProduct, updatedAt: new Date().toISOString() }), { merge: true });
            } catch {
              // ignore ADC unavailability
            }
          }

          room.version += 1;
          const ackData = { ok: true, version: room.version, data: { product: nextProduct } };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });

          broadcastInventoryDelta(room, {
            source: 'product:upsert',
            eventId,
            updatedProducts: [nextProduct],
            unsharedProductIds
          });
          return;
        }

        case 'product:restock': {
          if (room.mode === 'live' && !['retailer', 'admin'].includes(client.party)) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Only store retailers or admins can restock inventory.'
            });
            return;
          }

          const productId = String(msg.productId || '');
          const quantityAdded = Number(msg.quantityAdded ?? 0);
          const log = msg.log as RestockLog | undefined;

          if (!productId || !Number.isFinite(quantityAdded) || quantityAdded <= 0) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'INVALID_QUANTITY',
              message: 'Positive restock quantity is required.'
            });
            return;
          }

          const existing = room.products.get(productId);
          if (!existing) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'NOT_FOUND',
              message: `Product ${productId} not found in store ${room.storeId}.`
            });
            return;
          }

          const nextStock = Math.max(0, Number(existing.stock) + quantityAdded);
          const nextProduct: Product = {
            ...existing,
            stock: nextStock,
            supplierId: msg.supplierId || existing.supplierId,
            supplierName: msg.supplierName || existing.supplierName
          };

          if (room.mode === 'live' && adminDb && room.hydratedFromFirestore) {
            try {
              const storeRef = adminDb.collection('stores').doc(room.storeId);
              await adminDb.runTransaction(async tx => {
                const pRef = storeRef.collection('products').doc(productId);
                const pSnap = await tx.get(pRef);
                const baseStock = pSnap.exists ? Math.max(0, Number((pSnap.data() as Product).stock ?? 0)) : Number(existing.stock);
                const txNextStock = baseStock + quantityAdded;
                nextProduct.stock = txNextStock;
                tx.set(
                  pRef,
                  {
                    stock: txNextStock,
                    ...(nextProduct.supplierId ? { supplierId: nextProduct.supplierId } : {}),
                    ...(nextProduct.supplierName ? { supplierName: nextProduct.supplierName } : {}),
                    updatedAt: new Date().toISOString()
                  },
                  { merge: true }
                );
                if (log?.id) {
                  tx.set(
                    storeRef.collection('restockLogs').doc(log.id),
                    sanitizeForFirestore({ ...log, previousStock: baseStock, newStock: txNextStock, storeId: room.storeId }),
                    { merge: true }
                  );
                }
              });
            } catch {
              // fallback to room ledger
            }
          }

          room.products.set(productId, nextProduct);
          room.version += 1;

          const ackData = { ok: true, version: room.version, data: { product: nextProduct } };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });

          broadcastInventoryDelta(room, {
            source: 'product:restock',
            eventId,
            updatedProducts: [nextProduct]
          });
          return;
        }

        case 'product:delete': {
          if (room.mode === 'live' && (!['retailer', 'admin'].includes(client.party) || client.role === 'crew')) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Only store owners or admins can delete products.'
            });
            return;
          }

          const productId = String(msg.productId || '');
          room.products.delete(productId);

          if (room.mode === 'live' && adminDb) {
            try {
              await adminDb.collection('stores').doc(room.storeId).collection('products').doc(productId).delete();
            } catch {
              // ignore ADC unavailability
            }
          }

          room.version += 1;
          const ackData = { ok: true, version: room.version, data: { productId } };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });

          broadcastInventoryDelta(room, {
            source: 'product:delete',
            eventId,
            removedProductIds: [productId]
          });
          return;
        }

        case 'restock:order_upsert':
        case 'restock:order_status': {
          if (room.mode === 'live' && (!['retailer', 'wholesaler', 'admin'].includes(client.party) || client.role === 'crew')) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Only retailers, wholesalers, or admins can update B2B restock orders.'
            });
            return;
          }

          const incomingOrder = msg.order as RestockOrder | undefined;
          const orderId = String(incomingOrder?.id || msg.orderId || '');
          if (!orderId) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'INVALID_PAYLOAD',
              message: 'Restock order id is required.'
            });
            return;
          }

          const existing = room.restockOrders.get(orderId);
          const nextStatus = (msg.status || incomingOrder?.status || existing?.status || 'suggested') as RestockOrder['status'];
          const extra = (msg.extra || {}) as Partial<RestockOrder>;

          const mergedOrder: RestockOrder = {
            ...(existing || ({} as RestockOrder)),
            ...(incomingOrder || {}),
            ...extra,
            id: orderId,
            retailerStoreId: incomingOrder?.retailerStoreId || existing?.retailerStoreId || room.storeId,
            status: nextStatus
          };

          const updatedProducts: Product[] = [];
          const updatedWholesalerProducts: WholesalerProduct[] = [];

          // Idempotent atomic delivery stock reconciliation across Retailer + Wholesaler
          const shouldCreditDeliveryStock =
            nextStatus === 'delivered' && !existing?.stockAppliedOnDelivery && !mergedOrder.stockAppliedOnDelivery;

          if (shouldCreditDeliveryStock) {
            const qtyToAdd = Math.max(0, Number(mergedOrder.quotedQty || mergedOrder.suggestedQty || 0));
            if (qtyToAdd > 0) {
              const targetProd = room.products.get(mergedOrder.productId);
              if (targetProd) {
                const updatedProd: Product = {
                  ...targetProd,
                  stock: Math.max(0, Number(targetProd.stock) + qtyToAdd)
                };
                room.products.set(targetProd.id, updatedProd);
                updatedProducts.push(updatedProd);
              }

              // Also decrement matching Wholesaler bulk catalog item if present
              for (const wsProd of room.wholesalerProducts.values()) {
                const nameMatch =
                  wsProd.wholesalerId === mergedOrder.wholesalerId &&
                  (wsProd.id === mergedOrder.productId ||
                    wsProd.name.trim().toLowerCase() === mergedOrder.productName?.trim().toLowerCase());
                if (nameMatch) {
                  const updatedWsProd: WholesalerProduct = {
                    ...wsProd,
                    stockAvailable: Math.max(0, Number(wsProd.stockAvailable) - qtyToAdd)
                  };
                  room.wholesalerProducts.set(wsProd.id, updatedWsProd);
                  updatedWholesalerProducts.push(updatedWsProd);
                  break;
                }
              }
            }
            mergedOrder.stockAppliedOnDelivery = true;
          } else if (existing?.stockAppliedOnDelivery) {
            mergedOrder.stockAppliedOnDelivery = true;
          }

          room.restockOrders.set(orderId, mergedOrder);

          if (room.mode === 'live' && adminDb) {
            try {
              const storeRef = adminDb.collection('stores').doc(room.storeId);
              await adminDb.runTransaction(async tx => {
                if (shouldCreditDeliveryStock && updatedProducts.length > 0) {
                  for (const prod of updatedProducts) {
                    const pRef = storeRef.collection('products').doc(prod.id);
                    const pSnap = await tx.get(pRef);
                    const qtyToAdd = Math.max(0, Number(mergedOrder.quotedQty || mergedOrder.suggestedQty || 0));
                    const cloudStock = pSnap.exists
                      ? Math.max(0, Number((pSnap.data() as Product).stock ?? 0)) + qtyToAdd
                      : prod.stock;
                    prod.stock = cloudStock;
                    room.products.set(prod.id, prod);
                    tx.set(pRef, { stock: cloudStock, updatedAt: new Date().toISOString() }, { merge: true });
                  }
                }
                tx.set(
                  storeRef.collection('restockOrders').doc(orderId),
                  sanitizeForFirestore({ ...mergedOrder, storeId: room.storeId }),
                  { merge: true }
                );
              });
            } catch {
              // ignore ADC unavailability
            }
          }

          room.version += 1;
          const ackData = {
            ok: true,
            version: room.version,
            data: { order: mergedOrder, updatedProducts, updatedWholesalerProducts }
          };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });

          broadcastEvent(
            room,
            {
              type: 'restock:updated',
              storeId: room.storeId,
              version: room.version,
              eventId,
              order: mergedOrder
            },
            c => c.party !== 'customer'
          );

          if (updatedProducts.length > 0) {
            broadcastInventoryDelta(room, {
              source: 'restock:delivered',
              eventId,
              updatedProducts
            });
          }

          if (updatedWholesalerProducts.length > 0) {
            broadcastEvent(
              room,
              {
                type: 'wholesaler_catalog:delta',
                storeId: room.storeId,
                version: room.version,
                eventId,
                updatedWholesalerProducts
              },
              c => c.party !== 'customer'
            );
          }
          return;
        }

        case 'wholesaler:catalog_update': {
          if (room.mode === 'live' && !['wholesaler', 'admin'].includes(client.party)) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'FORBIDDEN',
              message: 'Only wholesalers or admins can update wholesaler catalog stock.'
            });
            return;
          }

          const wsProduct = msg.product as WholesalerProduct | undefined;
          if (!wsProduct || !wsProduct.id) {
            sendJson(client.ws, {
              type: 'mutation:error',
              requestId,
              code: 'INVALID_PAYLOAD',
              message: 'Wholesaler product with id is required.'
            });
            return;
          }

          const existing = room.wholesalerProducts.get(wsProduct.id);
          const nextWsProd: WholesalerProduct = {
            ...(existing || {}),
            ...wsProduct,
            stockAvailable: Math.max(0, Number(wsProduct.stockAvailable ?? existing?.stockAvailable ?? 0))
          };
          room.wholesalerProducts.set(nextWsProd.id, nextWsProd);
          room.version += 1;

          const ackData = {
            ok: true,
            version: room.version,
            data: { wholesalerProduct: nextWsProd }
          };
          recordIdempotentAck(room, requestId, ackData);
          sendJson(client.ws, { type: 'mutation:ack', requestId, ...ackData });

          broadcastEvent(
            room,
            {
              type: 'wholesaler_catalog:delta',
              storeId: room.storeId,
              version: room.version,
              eventId,
              updatedWholesalerProducts: [nextWsProd]
            },
            c => c.party !== 'customer'
          );
          return;
        }

        default: {
          sendJson(client.ws, {
            type: 'mutation:error',
            requestId,
            code: 'UNKNOWN_MESSAGE',
            message: `Unsupported inventory message type: ${String(msg.type)}`
          });
        }
      }
    });
  };

  wss.on('connection', (ws: WebSocket) => {
    const clientId = crypto.randomUUID();
    let activeClient: RoomClient | null = null;

    ws.on('pong', () => {
      if (activeClient) activeClient.isAlive = true;
    });

    ws.on('message', async raw => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        sendJson(ws, { type: 'error', code: 'INVALID_JSON', message: 'Invalid JSON payload.' });
        return;
      }

      if (msg.type === 'ping') {
        if (activeClient) activeClient.isAlive = true;
        sendJson(ws, { type: 'pong', timestamp: Date.now() });
        return;
      }

      if (msg.type === 'join') {
        const mode: 'demo' | 'live' = msg.mode === 'demo' ? 'demo' : 'live';
        const storeId = typeof msg.storeId === 'string' && msg.storeId.trim() ? msg.storeId.trim() : 'store-1';
        const requestedParty: WebSocketParty = VALID_PARTIES.has(msg.party) ? msg.party : 'retailer';

        let authResult: {
          ok: true;
          uid?: string;
          email?: string;
          role: CanonicalRole;
          party: WebSocketParty;
          clientId?: string;
          assignedStoreIds?: string[];
          wholesalerId?: string;
        };

        if (mode === 'demo') {
          const demoRole: CanonicalRole =
            requestedParty === 'wholesaler'
              ? 'wholesaler_admin'
              : requestedParty === 'customer'
              ? 'customer'
              : requestedParty === 'admin'
              ? 'super_admin'
              : 'client';
          authResult = {
            ok: true,
            role: demoRole,
            party: requestedParty
          };
        } else {
          const verified = await verifyLiveJoinCaller({
            idToken: msg.idToken,
            requestedParty,
            storeId
          });
          if ('code' in verified) {
            sendJson(ws, {
              type: 'error',
              code: verified.code,
              message: verified.message
            });
            ws.close(4003, verified.message);
            return;
          }
          authResult = verified;
        }

        // Remove from previous room if switching stores or parties on the same socket
        if (activeClient) {
          const prevRoom = rooms.get(activeClient.roomKey);
          if (prevRoom) {
            prevRoom.clients.delete(activeClient);
            broadcastPresence(prevRoom);
          }
        }

        const room = getOrCreateRoom(mode, storeId);
        await withRoomLock(room, async () => {
          await hydrateRoomFromFirestore(room);
          seedRoomIfEmpty(room, msg.initialState as InitialRoomState | undefined);

          activeClient = {
            id: clientId,
            ws,
            isAlive: true,
            roomKey: room.roomKey,
            mode,
            storeId: room.storeId,
            party: authResult.party,
            role: authResult.role,
            uid: authResult.uid,
            email: authResult.email,
            clientId: authResult.clientId,
            assignedStoreIds: authResult.assignedStoreIds,
            wholesalerId: authResult.wholesalerId
          };

          room.clients.add(activeClient);
          sendJson(ws, buildSnapshotForClient(room, activeClient));
          broadcastPresence(room);
        });
        return;
      }

      if (!activeClient) {
        sendJson(ws, {
          type: 'error',
          requestId: msg.requestId,
          code: 'NOT_JOINED',
          message: 'Client must send join message before mutations.'
        });
        return;
      }

      await handleMutation(activeClient, msg);
    });

    ws.on('close', () => {
      if (!activeClient) return;
      const room = rooms.get(activeClient.roomKey);
      if (room) {
        room.clients.delete(activeClient);
        broadcastPresence(room);
      }
      activeClient = null;
    });
  });

  const heartbeatTimer = setInterval(() => {
    for (const room of rooms.values()) {
      for (const client of room.clients) {
        if (!client.isAlive) {
          room.clients.delete(client);
          client.ws.terminate();
          broadcastPresence(room);
          continue;
        }
        client.isAlive = false;
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }
  }, heartbeatIntervalMs);

  const close = async () => {
    clearInterval(heartbeatTimer);
    for (const room of rooms.values()) {
      for (const client of room.clients) {
        try {
          client.ws.close(1001, 'Server shutting down');
        } catch {
          // ignore close error
        }
      }
      room.clients.clear();
    }
    await new Promise<void>(resolve => {
      wss.close(() => resolve());
    });
  };

  return {
    wss,
    rooms,
    close
  };
}
