import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'http';
import { WebSocket } from 'ws';
import { createInventoryWebSocketManager } from '../inventoryWs';
import type { Product, WholesalerProduct, RestockOrder, CustomerOrder, POSInvoice } from '../../types';

interface TestClient {
  ws: WebSocket;
  messages: any[];
  waitFor: (predicate: (msg: any) => boolean, timeoutMs?: number) => Promise<any>;
  send: (payload: Record<string, any>) => void;
  close: () => Promise<void>;
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    storeId: 'store-1',
    name: 'India Gate Basmati Rice 5kg',
    barcode: '8901234567890',
    qrCode: 'QR-8901234567890',
    category: 'Grains',
    brand: 'India Gate',
    purchasePrice: 420,
    sellingPrice: 540,
    mrp: 599,
    stock: 10,
    minThreshold: 5,
    taxRate: 5,
    unit: 'bag',
    sharedWithWholesalers: true,
    ...overrides
  };
}

function makeWholesalerProduct(overrides: Partial<WholesalerProduct> = {}): WholesalerProduct {
  return {
    id: 'prod-1',
    wholesalerId: 'ws-101',
    name: 'India Gate Basmati Rice 5kg',
    category: 'Grains',
    brand: 'India Gate',
    moq: 10,
    wholesalePrice: 410,
    mrp: 599,
    tierPrices: [{ minQty: 10, price: 410 }],
    stockAvailable: 100,
    unit: 'bag',
    ...overrides
  };
}

async function connectTestClient(url: string): Promise<TestClient> {
  const ws = new WebSocket(url);
  const messages: any[] = [];
  const waiters: Array<{
    predicate: (msg: any) => boolean;
    resolve: (msg: any) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());
    messages.push(msg);
    for (let i = waiters.length - 1; i >= 0; i--) {
      const waiter = waiters[i];
      if (waiter.predicate(msg)) {
        clearTimeout(waiter.timer);
        waiters.splice(i, 1);
        waiter.resolve(msg);
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', err => reject(err));
  });

  const waitFor = (predicate: (msg: any) => boolean, timeoutMs = 3000) => {
    const existing = messages.find(predicate);
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = waiters.findIndex(w => w.timer === timer);
        if (idx >= 0) waiters.splice(idx, 1);
        reject(new Error(`Timed out waiting for WebSocket message (${timeoutMs}ms)`));
      }, timeoutMs);
      waiters.push({ predicate, resolve, reject, timer });
    });
  };

  const send = (payload: Record<string, any>) => {
    ws.send(JSON.stringify(payload));
  };

  const close = async () => {
    if (ws.readyState === WebSocket.CLOSED) return;
    await new Promise<void>(resolve => {
      ws.once('close', () => resolve());
      ws.close();
    });
  };

  return { ws, messages, waitFor, send, close };
}

describe('Real-Time WebSocket Inventory Synchronization', () => {
  let server: http.Server;
  let wsManager: ReturnType<typeof createInventoryWebSocketManager>;
  let wsUrl: string;
  const openClients: TestClient[] = [];

  beforeEach(async () => {
    server = http.createServer();
    wsManager = createInventoryWebSocketManager({
      server,
      adminDb: null,
      adminAuth: null,
      path: '/ws/inventory',
      heartbeatIntervalMs: 60000,
      allowUnauthenticatedLiveForTests: true
    });
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('Failed to bind test HTTP server');
    }
    wsUrl = `ws://127.0.0.1:${addr.port}/ws/inventory`;
  });

  afterEach(async () => {
    for (const c of openClients) {
      await c.close();
    }
    openClients.length = 0;
    await wsManager.close();
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  const joinParty = async (
    party: 'retailer' | 'wholesaler' | 'customer',
    initialProducts: Product[] = [makeProduct()],
    extra: Record<string, any> = {}
  ) => {
    const client = await connectTestClient(wsUrl);
    openClients.push(client);
    client.send({
      type: 'join',
      mode: 'demo',
      storeId: 'store-1',
      party,
      initialState: {
        products: initialProducts,
        wholesalerProducts: [makeWholesalerProduct()],
        restockOrders: [],
        customerOrders: []
      },
      ...extra
    });
    const snapshot = await client.waitFor(m => m.type === 'inventory:snapshot');
    return { client, snapshot };
  };

  it('propagates POS sales immediately to Retailer, Wholesaler, and Customer while stripping customer purchasePrice', async () => {
    const { client: retailer, snapshot: retailerSnap } = await joinParty('retailer', [
      makeProduct({ id: 'prod-shared', stock: 10, sharedWithWholesalers: true, purchasePrice: 400 }),
      makeProduct({ id: 'prod-private', name: 'Private Tea', stock: 8, sharedWithWholesalers: false, purchasePrice: 250 })
    ]);
    const { client: wholesaler, snapshot: wholesalerSnap } = await joinParty('wholesaler');
    const { client: customer, snapshot: customerSnap } = await joinParty('customer');

    expect(retailerSnap.products).toHaveLength(2);
    // Wholesaler sees only shared products
    expect(wholesalerSnap.products.map((p: Product) => p.id)).toEqual(['prod-shared']);
    // Customer never receives purchasePrice
    expect(customerSnap.products.find((p: Product) => p.id === 'prod-shared')?.purchasePrice).toBe(0);

    const invoice: POSInvoice = {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      storeId: 'store-1',
      storeName: 'Ellic Mart',
      storeGSTIN: '27AAACE1234F1Z5',
      storeAddress: 'Worli, Mumbai',
      customerName: 'Walk-in',
      customerPhone: '+91 99999 00000',
      date: '2026-11-13 10:00',
      isGSTInvoice: true,
      items: [
        {
          productId: 'prod-shared',
          productName: 'India Gate Basmati Rice 5kg',
          quantity: 4,
          unitPrice: 540,
          discount: 0,
          taxRate: 5,
          taxAmount: 108,
          total: 2268
        }
      ],
      subtotal: 2160,
      discountTotal: 0,
      cgst: 54,
      sgst: 54,
      igst: 0,
      grandTotal: 2268,
      paymentMethod: 'upi',
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: 0
    };

    retailer.send({
      type: 'pos:sale',
      requestId: 'req-sale-1',
      invoice
    });

    const [ack, retailerDelta, wholesalerDelta, customerDelta] = await Promise.all([
      retailer.waitFor(m => m.type === 'mutation:ack' && m.requestId === 'req-sale-1'),
      retailer.waitFor(m => m.type === 'inventory:delta' && m.source === 'pos:sale'),
      wholesaler.waitFor(m => m.type === 'inventory:delta' && m.source === 'pos:sale'),
      customer.waitFor(m => m.type === 'inventory:delta' && m.source === 'pos:sale')
    ]);

    expect(ack.ok).toBe(true);
    expect(retailerDelta.updatedProducts[0].stock).toBe(6);
    expect(wholesalerDelta.updatedProducts[0].stock).toBe(6);
    expect(customerDelta.updatedProducts[0].stock).toBe(6);
    expect(customerDelta.updatedProducts[0].purchasePrice).toBe(0);

    // Toggling sharedWithWholesalers=false immediately removes product from wholesaler view
    retailer.send({
      type: 'product:upsert',
      requestId: 'req-unshare',
      product: makeProduct({ id: 'prod-shared', stock: 6, sharedWithWholesalers: false })
    });
    const unshareDelta = await wholesaler.waitFor(
      m => m.type === 'inventory:delta' && m.source === 'product:upsert'
    );
    expect(unshareDelta.updatedProducts).toEqual([]);
    expect(unshareDelta.removedProductIds).toEqual(['prod-shared']);
  });

  it('prevents overselling under concurrent POS sale and Customer order race conditions', async () => {
    const { client: retailer } = await joinParty('retailer', [makeProduct({ id: 'prod-race', stock: 3 })]);
    const { client: customer } = await joinParty('customer');

    const invoice: POSInvoice = {
      id: 'inv-race',
      invoiceNumber: 'INV-RACE',
      storeId: 'store-1',
      storeName: 'Ellic Mart',
      storeGSTIN: '27AAACE1234F1Z5',
      storeAddress: 'Worli, Mumbai',
      customerName: 'Walk-in',
      customerPhone: '+91 99999 00000',
      date: '2026-11-13 10:05',
      isGSTInvoice: true,
      items: [
        {
          productId: 'prod-race',
          productName: 'India Gate Basmati Rice 5kg',
          quantity: 2,
          unitPrice: 540,
          discount: 0,
          taxRate: 5,
          taxAmount: 54,
          total: 1134
        }
      ],
      subtotal: 1080,
      discountTotal: 0,
      cgst: 27,
      sgst: 27,
      igst: 0,
      grandTotal: 1134,
      paymentMethod: 'cash',
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: 0
    };

    const customerOrder: CustomerOrder = {
      id: 'co-race',
      orderNumber: 'ORD-RACE',
      customerId: 'cust-1',
      customerName: 'Rahul',
      customerPhone: '+91 98211 22334',
      storeId: 'store-1',
      storeName: 'Ellic Mart',
      orderType: 'pickup',
      items: [
        {
          productId: 'prod-race',
          productName: 'India Gate Basmati Rice 5kg',
          quantity: 2,
          unitPrice: 540
        }
      ],
      totalAmount: 1080,
      paymentStatus: 'paid_online',
      paymentMethod: 'UPI',
      orderStatus: 'placed',
      createdAt: '2026-11-13 10:05',
      pickupQrCode: 'QR-RACE',
      stockReserved: true
    };

    // Dispatch both 2-unit orders simultaneously when total stock is 3
    retailer.send({ type: 'pos:sale', requestId: 'race-pos', invoice });
    customer.send({ type: 'customer:order_create', requestId: 'race-cust', order: customerOrder });

    const [posResult, custResult] = await Promise.all([
      retailer.waitFor(m => m.requestId === 'race-pos' && (m.type === 'mutation:ack' || m.type === 'inventory:rejected')),
      customer.waitFor(m => m.requestId === 'race-cust' && (m.type === 'mutation:ack' || m.type === 'inventory:rejected'))
    ]);

    const outcomes = [posResult, custResult];
    const successes = outcomes.filter(o => o.type === 'mutation:ack');
    const rejections = outcomes.filter(o => o.type === 'inventory:rejected');

    expect(successes).toHaveLength(1);
    expect(rejections).toHaveLength(1);
    expect(rejections[0].code).toBe('INSUFFICIENT_STOCK');
    expect(rejections[0].availableStock).toBe(1);

    // Authoritative stock must be exactly 1 (never negative)
    const room = wsManager.rooms.get('demo:store-1');
    expect(room?.products.get('prod-race')?.stock).toBe(1);
  });

  it('synchronizes wholesaler delivery restock once (idempotently) and updates wholesaler bulk catalog stock', async () => {
    const { client: retailer } = await joinParty('retailer', [makeProduct({ id: 'prod-1', stock: 4 })]);
    const { client: wholesaler } = await joinParty('wholesaler');
    const { client: customer } = await joinParty('customer');

    const order: RestockOrder = {
      id: 'ro-1',
      retailerStoreId: 'store-1',
      retailerName: 'Ellic Mart',
      wholesalerId: 'ws-101',
      wholesalerName: 'Metro Mega Distribution',
      productId: 'prod-1',
      productName: 'India Gate Basmati Rice 5kg',
      suggestedQty: 15,
      quotedQty: 15,
      quotedUnitPrice: 410,
      totalQuotedAmount: 6150,
      status: 'dispatched',
      createdAt: '2026-11-13 10:00'
    };

    retailer.send({ type: 'restock:order_upsert', requestId: 'req-ro-up', order });
    await wholesaler.waitFor(m => m.type === 'restock:updated' && m.order.id === 'ro-1');

    wholesaler.send({
      type: 'restock:order_status',
      requestId: 'req-ro-delivered-1',
      orderId: 'ro-1',
      status: 'delivered'
    });

    const [ack, retailerDelta, customerDelta, wsCatalogDelta] = await Promise.all([
      wholesaler.waitFor(m => m.type === 'mutation:ack' && m.requestId === 'req-ro-delivered-1'),
      retailer.waitFor(m => m.type === 'inventory:delta' && m.source === 'restock:delivered'),
      customer.waitFor(m => m.type === 'inventory:delta' && m.source === 'restock:delivered'),
      retailer.waitFor(m => m.type === 'wholesaler_catalog:delta')
    ]);

    expect(ack.ok).toBe(true);
    expect(retailerDelta.updatedProducts[0].stock).toBe(19);
    expect(customerDelta.updatedProducts[0].stock).toBe(19);
    expect(wsCatalogDelta.updatedWholesalerProducts[0].stockAvailable).toBe(85);

    // Duplicate delivered status with different requestId must NOT double-credit stock
    wholesaler.send({
      type: 'restock:order_status',
      requestId: 'req-ro-delivered-2',
      orderId: 'ro-1',
      status: 'delivered'
    });
    const ack2 = await wholesaler.waitFor(m => m.type === 'mutation:ack' && m.requestId === 'req-ro-delivered-2');
    expect(ack2.data.updatedProducts).toHaveLength(0);
    expect(wsManager.rooms.get('demo:store-1')?.products.get('prod-1')?.stock).toBe(19);
  });

  it('restores stock on customer order cancellation once and propagates across all connected parties', async () => {
    const { client: retailer } = await joinParty('retailer', [makeProduct({ id: 'prod-1', stock: 10 })]);
    const { client: wholesaler } = await joinParty('wholesaler');
    const { client: customer } = await joinParty('customer');

    const custOrder: CustomerOrder = {
      id: 'co-cancel-1',
      orderNumber: 'ORD-C1',
      customerId: 'cust-1',
      customerName: 'Rahul',
      customerPhone: '+91 98211 22334',
      storeId: 'store-1',
      storeName: 'Ellic Mart',
      orderType: 'pickup',
      items: [{ productId: 'prod-1', productName: 'India Gate Basmati Rice 5kg', quantity: 3, unitPrice: 540 }],
      totalAmount: 1620,
      paymentStatus: 'paid_online',
      paymentMethod: 'UPI',
      orderStatus: 'placed',
      createdAt: '2026-11-13 10:10',
      pickupQrCode: 'QR-C1',
      stockReserved: true
    };

    customer.send({ type: 'customer:order_create', requestId: 'req-co-1', order: custOrder });
    await Promise.all([
      retailer.waitFor(m => m.type === 'inventory:delta' && m.source === 'customer:order_create'),
      wholesaler.waitFor(m => m.type === 'inventory:delta' && m.source === 'customer:order_create')
    ]);
    expect(wsManager.rooms.get('demo:store-1')?.products.get('prod-1')?.stock).toBe(7);

    customer.send({
      type: 'customer:order_status',
      requestId: 'req-co-cancel-1',
      orderId: 'co-cancel-1',
      status: 'cancelled'
    });

    const [retailerRestore, wholesalerRestore, customerRestore] = await Promise.all([
      retailer.waitFor(m => m.type === 'inventory:delta' && m.source === 'customer:order_cancelled'),
      wholesaler.waitFor(m => m.type === 'inventory:delta' && m.source === 'customer:order_cancelled'),
      customer.waitFor(m => m.type === 'inventory:delta' && m.source === 'customer:order_cancelled')
    ]);

    expect(retailerRestore.updatedProducts[0].stock).toBe(10);
    expect(wholesalerRestore.updatedProducts[0].stock).toBe(10);
    expect(customerRestore.updatedProducts[0].stock).toBe(10);

    // Duplicate cancel should not restore twice
    customer.send({
      type: 'customer:order_status',
      requestId: 'req-co-cancel-2',
      orderId: 'co-cancel-1',
      status: 'cancelled'
    });
    const ackDupCancel = await customer.waitFor(m => m.type === 'mutation:ack' && m.requestId === 'req-co-cancel-2');
    expect(ackDupCancel.data.updatedProducts).toHaveLength(0);
    expect(wsManager.rooms.get('demo:store-1')?.products.get('prod-1')?.stock).toBe(10);
  });

  it('replays idempotent requestId acknowledgements cleanly and syncs state on client reconnect', async () => {
    const { client: retailer } = await joinParty('retailer', [makeProduct({ id: 'prod-1', stock: 12 })]);

    retailer.send({
      type: 'product:restock',
      requestId: 'req-restock-idemp',
      productId: 'prod-1',
      quantityAdded: 5
    });
    const ack1 = await retailer.waitFor(m => m.type === 'mutation:ack' && m.requestId === 'req-restock-idemp');
    expect(ack1.data.product.stock).toBe(17);

    // Retry same requestId (simulating reconnect flush)
    retailer.send({
      type: 'product:restock',
      requestId: 'req-restock-idemp',
      productId: 'prod-1',
      quantityAdded: 5
    });
    const ack2 = await retailer.waitFor(
      m => m.type === 'mutation:ack' && m.requestId === 'req-restock-idemp' && m.idempotentReplay === true
    );
    expect(ack2.data.product.stock).toBe(17);

    // Late-joining customer receives full updated snapshot immediately
    const { snapshot: lateCustomerSnap } = await joinParty('customer');
    expect(lateCustomerSnap.products.find((p: Product) => p.id === 'prod-1')?.stock).toBe(17);
  });

  it('requires authentication token for live rooms when test bypass is disabled', async () => {
    const strictServer = http.createServer();
    const strictWs = createInventoryWebSocketManager({
      server: strictServer,
      adminDb: null,
      adminAuth: null,
      path: '/ws/inventory',
      allowUnauthenticatedLiveForTests: false
    });
    await new Promise<void>(resolve => strictServer.listen(0, '127.0.0.1', () => resolve()));
    const addr = strictServer.address() as { port: number };

    try {
      const client = await connectTestClient(`ws://127.0.0.1:${addr.port}/ws/inventory`);
      client.send({
        type: 'join',
        mode: 'live',
        storeId: 'store-1',
        party: 'retailer'
      });
      const errMsg = await client.waitFor(m => m.type === 'error');
      expect(errMsg.code).toBe('UNAUTHORIZED');
      await client.close();
    } finally {
      await strictWs.close();
      await new Promise<void>(resolve => strictServer.close(() => resolve()));
    }
  });
});
