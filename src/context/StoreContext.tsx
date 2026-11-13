import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ActiveModule,
  UserRole,
  User,
  Store,
  Product,
  Supplier,
  RestockLog,
  BusinessApplication,
  Wholesaler,
  WholesalerProduct,
  RetailerWholesalerConnection,
  CustomerProfile,
  POSInvoice,
  RestockOrder,
  CustomerOrder,
  Employee,
  AppNotification,
  AuditLog,
  SubscriptionPlan,
  InvoiceTemplate,
  CloudSyncState,
  SaveFeedback,
  normalizeCanonicalRole,
  isUserStatusInactive,
  PlatformTelemetryStats,
  WebSocketSyncStatus,
  WebSocketRoomPresence,
  WebSocketParty
} from '../types';
import {
  mockStores,
  mockProducts,
  mockSuppliers,
  mockRestockLogs,
  mockBusinessApplications,
  mockWholesalers,
  mockWholesalerProducts,
  mockConnections,
  mockCustomers,
  mockInvoices,
  mockRestockOrders,
  mockCustomerOrders,
  mockEmployees,
  mockNotifications,
  mockAuditLogs,
  mockSubscriptions,
  mockInvoiceTemplates
} from '../data/mockData';
import { useAuth } from './AuthContext';
import {
  syncManager as rawSyncManager,
  getOfflineQueue,
  InsufficientStockError,
  isInsufficientStockError,
  reconcileStoreInvoiceCounter,
  reserveStoreInvoiceNumber,
  commitStoreInvoiceNumber,
  releaseStoreInvoiceNumberReservation,
  stripMockFixtures
} from '../lib/firestoreSync';
export { InsufficientStockError };
import { inventorySocket } from '../lib/inventorySocket';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb } from '../lib/firebase';

interface StoreContextType {
  isDemoMode?: boolean;
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentUser: User;
  activeStore: Store;
  setActiveStore: (store: Store) => void;
  stores: Store[];
  products: Product[];
  suppliers: Supplier[];
  restockLogs: RestockLog[];
  businessApplications: BusinessApplication[];
  wholesalers: Wholesaler[];
  wholesalerProducts: WholesalerProduct[];
  connections: RetailerWholesalerConnection[];
  customers: CustomerProfile[];
  invoices: POSInvoice[];
  restockOrders: RestockOrder[];
  customerOrders: CustomerOrder[];
  employees: Employee[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  subscription: SubscriptionPlan;
  invoiceTemplates: InvoiceTemplate[];
  unreadCount: number;

  // Theme & Settings
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Global Popup Modals State
  isNotificationModalOpen: boolean;
  setIsNotificationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Cloud Firestore Sync State
  cloudSyncState: CloudSyncState;
  saveFeedback: SaveFeedback;
  wsStatus: WebSocketSyncStatus;
  wsPresence: WebSocketRoomPresence;
  forceCloudSync: () => Promise<void>;
  isDataLoading: boolean;
  setIsDataLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductSharing: (id: string) => void;
  updateWholesalerProductStock: (id: string, stockAvailable: number) => void;
  createInvoice: (invoice: Omit<POSInvoice, 'id' | 'invoiceNumber'> & { id?: string }) => Promise<POSInvoice>;
  deleteInvoice: (id: string) => void;
  addInvoiceTemplate: (template: Omit<InvoiceTemplate, 'id' | 'createdAt'>) => InvoiceTemplate;
  updateInvoiceTemplate: (id: string, updates: Partial<InvoiceTemplate>) => void;
  deleteInvoiceTemplate: (id: string) => void;
  setDefaultInvoiceTemplate: (id: string) => void;
  sendRestockRequest: (productId: string, quantity: number, wholesalerId?: string) => void;
  updateRestockOrder: (orderId: string, status: RestockOrder['status'], extra?: Partial<RestockOrder>) => void;
  acceptQuotationAndGeneratePO: (orderId: string) => void;
  createCustomerOrder: (orderData: Omit<CustomerOrder, 'id' | 'orderNumber' | 'createdAt' | 'pickupQrCode'>) => Promise<CustomerOrder>;
  updateCustomerOrderStatus: (orderId: string, status: CustomerOrder['orderStatus']) => void;
  addCustomer: (customer: Omit<CustomerProfile, 'id' | 'totalPurchases'>) => CustomerProfile;
  updateCustomer: (id: string, updates: Partial<CustomerProfile>) => void;
  deleteCustomer: (id: string) => void;
  receiveCreditPayment: (customerId: string, amount: number) => void;
  batchAssignInvoiceTemplate: (customerIds: string[], templateId: string) => void;
  updateCustomerSegment: (customerId: string, segment: string) => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  batchUpdateEmployees: (ids: string[], updates: Partial<Employee>, actionDescription?: string) => void;
  batchDeleteEmployees: (ids: string[]) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addRestockLog: (log: Omit<RestockLog, 'id' | 'date'>) => void;
  addBusinessApplication: (app: Omit<BusinessApplication, 'id' | 'appliedAt' | 'status'>) => BusinessApplication;
  approveBusinessApplication: (id: string, notes?: string) => void;
  rejectBusinessApplication: (id: string, notes?: string) => void;
  cancelSubscriptionAndDeleteData: (confirmationStoreName: string) => Promise<boolean>;
  paySubscriptionBill: () => void;
  renewSubscription: () => Promise<void>;
  addWholesaler: (wholesaler: Omit<Wholesaler, 'id'>) => Wholesaler;
  updateWholesaler: (id: string, updates: Partial<Wholesaler>) => void;
  deleteWholesaler: (id: string) => void;
  addStore: (store: Omit<Store, 'id' | 'rating' | 'reviewCount'>) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  toggleStorePause: (storeId: string, isPaused: boolean, reason?: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  visitorStats: PlatformTelemetryStats;
  refreshVisitorStats: () => Promise<void>;
  updateSubscription: (updates: Partial<SubscriptionPlan>) => void;
  clearAuditLogs: () => void;
  toggleConnectionStatus: (connectionId: string, status: RetailerWholesalerConnection['status']) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addAuditLog: (action: string, details: string, status?: AuditLog['status']) => void;
  resetToDefaultData: () => void;
  restoreDatabaseFromJSON: (snapshot: any) => { success: boolean; message: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode; isDemoMode?: boolean }> = ({
  children,
  isDemoMode: isDemoModeProp = false,
}) => {
  const isDemoRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.replace(/\/+$/, '').toLowerCase() === '/demo' ||
      window.location.pathname.toLowerCase().startsWith('/demo/') ||
      window.location.hash.toLowerCase() === '#demo');
  const isDemoMode = Boolean(isDemoModeProp || isDemoRoute);
  const isFirestoreAvailable = Boolean(firestoreDb) && !isDemoMode;
  const syncManager = React.useMemo<typeof rawSyncManager>(() => {
    if (!isDemoMode) return rawSyncManager;
    return new Proxy(rawSyncManager, {
      get(_target, prop) {
        if (prop === 'getDatabaseId') return () => 'demo-sandbox';
        if (prop === 'subscribeToStore') {
          return (_storeId: string, callbacks: any) => {
            if (callbacks?.onInitialDataLoaded) {
              setTimeout(() => callbacks.onInitialDataLoaded(), 40);
            }
            return () => {};
          };
        }
        return () => Promise.resolve();
      },
    });
  }, [isDemoMode]);

  // Load from local storage (when not in demo mode) or fallback to mock data
  const [activeModule, setActiveModule] = useState<ActiveModule>('retailer');
  const [activeRoleState, setActiveRoleState] = useState<UserRole>('client');

  const [stores, setStores] = useState<Store[]>(() => {
    if (isDemoMode) return mockStores;
    const saved = localStorage.getItem('ellix_stores');
    return saved ? JSON.parse(saved) : mockStores;
  });
  const [activeStore, setActiveStore] = useState<Store>(stores[0] || mockStores[0]);
  const hydratedStoreIdRef = React.useRef<string>((stores[0] || mockStores[0]).id);

  const loadStoreScopedCache = <T,>(baseKey: string, storeId: string, fallback: T[]): T[] => {
    if (isDemoMode) {
      return fallback.filter((item: any) => !item?.storeId || item.storeId === storeId);
    }
    try {
      const scoped = localStorage.getItem(`${baseKey}_${storeId}`);
      if (scoped) {
        return stripMockFixtures<T>(JSON.parse(scoped));
      }
    } catch {
      // ignore parse error
    }
    return [];
  };

  const [products, rawSetProducts] = useState<Product[]>(() =>
    loadStoreScopedCache('ellix_products', activeStore.id, mockProducts)
  );
  const productsRef = React.useRef<Product[]>(products);
  const inFlightReservedStockRef = React.useRef<Map<string, number>>(new Map());
  const invoiceSeqRef = React.useRef<number>(0);

  const setProducts = React.useCallback((updater: React.SetStateAction<Product[]>) => {
    const next = typeof updater === 'function'
      ? (updater as (prev: Product[]) => Product[])(productsRef.current)
      : updater;
    productsRef.current = next;
    rawSetProducts(next);
  }, []);

  const [wholesalers, setWholesalers] = useState<Wholesaler[]>(() =>
    loadStoreScopedCache('ellix_wholesalers', activeStore.id, mockWholesalers)
  );
  const [wholesalerProducts, rawSetWholesalerProducts] = useState<WholesalerProduct[]>(() =>
    isDemoMode ? mockWholesalerProducts : []
  );
  const wholesalerProductsRef = React.useRef<WholesalerProduct[]>(wholesalerProducts);
  const setWholesalerProducts = React.useCallback((updater: React.SetStateAction<WholesalerProduct[]>) => {
    const next = typeof updater === 'function'
      ? (updater as (prev: WholesalerProduct[]) => WholesalerProduct[])(wholesalerProductsRef.current)
      : updater;
    wholesalerProductsRef.current = next;
    rawSetWholesalerProducts(next);
  }, []);

  const [connections, setConnections] = useState<RetailerWholesalerConnection[]>(() => {
    if (isDemoMode) return mockConnections;
    try {
      const saved = localStorage.getItem(`ellix_connections_${activeStore.id}`);
      return saved ? stripMockFixtures<RetailerWholesalerConnection>(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const [customers, rawSetCustomers] = useState<CustomerProfile[]>(() =>
    loadStoreScopedCache('ellix_customers', activeStore.id, mockCustomers)
  );
  const customersRef = React.useRef<CustomerProfile[]>(customers);

  const setCustomers = React.useCallback((updater: React.SetStateAction<CustomerProfile[]>) => {
    const next = typeof updater === 'function'
      ? (updater as (prev: CustomerProfile[]) => CustomerProfile[])(customersRef.current)
      : updater;
    customersRef.current = next;
    rawSetCustomers(next);
  }, []);

  const [invoices, rawSetInvoices] = useState<POSInvoice[]>(() => {
    const initial = loadStoreScopedCache('ellix_invoices', activeStore.id, mockInvoices);
    reconcileStoreInvoiceCounter(activeStore.id, initial);
    return initial;
  });
  const invoicesRef = React.useRef<POSInvoice[]>(invoices);
  const inFlightInvoiceTasksRef = React.useRef<Map<string, Promise<POSInvoice>>>(new Map());

  const setInvoices = React.useCallback((updater: React.SetStateAction<POSInvoice[]>) => {
    const next = typeof updater === 'function'
      ? (updater as (prev: POSInvoice[]) => POSInvoice[])(invoicesRef.current)
      : updater;
    invoicesRef.current = next;
    rawSetInvoices(next);
  }, []);

  const [restockOrders, rawSetRestockOrders] = useState<RestockOrder[]>(() =>
    loadStoreScopedCache('ellix_restock_orders', activeStore.id, mockRestockOrders)
  );
  const restockOrdersRef = React.useRef<RestockOrder[]>(restockOrders);
  const setRestockOrders = React.useCallback((updater: React.SetStateAction<RestockOrder[]>) => {
    const next = typeof updater === 'function'
      ? (updater as (prev: RestockOrder[]) => RestockOrder[])(restockOrdersRef.current)
      : updater;
    restockOrdersRef.current = next;
    rawSetRestockOrders(next);
  }, []);

  const [customerOrders, rawSetCustomerOrders] = useState<CustomerOrder[]>(() =>
    loadStoreScopedCache('ellix_customer_orders', activeStore.id, mockCustomerOrders)
  );
  const customerOrdersRef = React.useRef<CustomerOrder[]>(customerOrders);
  const setCustomerOrders = React.useCallback((updater: React.SetStateAction<CustomerOrder[]>) => {
    const next = typeof updater === 'function'
      ? (updater as (prev: CustomerOrder[]) => CustomerOrder[])(customerOrdersRef.current)
      : updater;
    customerOrdersRef.current = next;
    rawSetCustomerOrders(next);
  }, []);

  const [employees, setEmployees] = useState<Employee[]>(() =>
    loadStoreScopedCache('ellix_employees', activeStore.id, mockEmployees)
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (isDemoMode) return mockNotifications;
    try {
      const saved = localStorage.getItem(`ellix_notifications_${activeStore.id}`);
      return saved ? stripMockFixtures<AppNotification>(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStoreScopedCache('ellix_audit_logs', activeStore.id, mockAuditLogs)
  );

  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplate[]>(() => {
    if (isDemoMode) return mockInvoiceTemplates;
    const saved = localStorage.getItem(`ellix_invoice_templates_${activeStore.id}`);
    return saved ? JSON.parse(saved) : mockInvoiceTemplates;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadStoreScopedCache('ellix_suppliers', activeStore.id, mockSuppliers)
  );

  const [restockLogs, setRestockLogs] = useState<RestockLog[]>(() =>
    loadStoreScopedCache('ellix_restock_logs', activeStore.id, mockRestockLogs)
  );

  const [businessApplications, setBusinessApplications] = useState<BusinessApplication[]>(() => {
    if (isDemoMode) return mockBusinessApplications;
    try {
      const saved = localStorage.getItem('ellix_business_applications');
      return saved ? stripMockFixtures<BusinessApplication>(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  const activeClientId = activeStore.clientId || 'client-001';
  const [subscription, setSubscription] = useState<SubscriptionPlan>(() => {
    if (isDemoMode) return mockSubscriptions[0];
    const saved = localStorage.getItem(`ellix_subscription_${activeClientId}`);
    return saved ? JSON.parse(saved) : mockSubscriptions[0];
  });
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Cloud Firestore Sync State
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>(() => ({
    status: 'synced',
    lastSyncedAt: new Date().toISOString(),
    pendingCount: getOfflineQueue().length,
    lastError: null,
    databaseId: syncManager.getDatabaseId(),
    syncedCounts: {
      products: 0,
      customers: 0,
      invoices: 0,
      restockOrders: 0,
      customerOrders: 0
    }
  }));

  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>({
    status: 'idle',
    message: '',
    timestamp: 0
  });

  const [wsStatus, setWsStatus] = useState<WebSocketSyncStatus>('disconnected');
  const [wsPresence, setWsPresence] = useState<WebSocketRoomPresence>({
    retailer: 0,
    wholesaler: 0,
    customer: 0,
    admin: 0,
    total: 0
  });

  // Data fetching / hydration state for smooth perceived performance & skeleton loaders
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('ellix_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Platform Telemetry & Visitor Stats
  const [visitorStats, setVisitorStats] = useState<PlatformTelemetryStats>(() => ({
    activeVisitors: 28,
    totalVisitors: 14380,
    todayVisitors: 842,
    dailyTrends: [
      { date: 'Oct 17', visitors: 690, pageViews: 2346, conversions: 33 },
      { date: 'Oct 18', visitors: 720, pageViews: 2448, conversions: 35 },
      { date: 'Oct 19', visitors: 680, pageViews: 2312, conversions: 32 },
      { date: 'Oct 20', visitors: 740, pageViews: 2516, conversions: 36 },
      { date: 'Oct 21', visitors: 810, pageViews: 2754, conversions: 39 },
      { date: 'Oct 22', visitors: 860, pageViews: 2924, conversions: 41 },
      { date: 'Oct 23', visitors: 790, pageViews: 2686, conversions: 38 },
      { date: 'Oct 24', visitors: 830, pageViews: 2822, conversions: 40 },
      { date: 'Oct 25', visitors: 890, pageViews: 3026, conversions: 43 },
      { date: 'Oct 26', visitors: 920, pageViews: 3128, conversions: 44 },
      { date: 'Oct 27', visitors: 880, pageViews: 2992, conversions: 42 },
      { date: 'Oct 28', visitors: 940, pageViews: 3196, conversions: 45 },
      { date: 'Oct 29', visitors: 910, pageViews: 3094, conversions: 44 },
      { date: 'Today', visitors: 842, pageViews: 2862, conversions: 40 }
    ],
    clientCount: 42,
    customerCount: 389,
    onlineStores: 3,
    pausedStores: 0,
    totalReviews: 1280,
    averageRating: 4.88
  }));

  const refreshVisitorStats = React.useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry/stats');
      if (res.ok) {
        const data = await res.json();
        setVisitorStats(prev => ({
          ...prev,
          ...data,
          onlineStores: stores.filter(s => s.status !== 'paused').length,
          pausedStores: stores.filter(s => s.status === 'paused').length,
          totalReviews: stores.reduce((sum, s) => sum + (s.reviewCount || 0), 0) || data.totalReviews || 1280
        }));
      }
    } catch {
      // offline fallback maintains cached state
    }
  }, [stores]);

  useEffect(() => {
    refreshVisitorStats();
    const interval = setInterval(refreshVisitorStats, 30000);
    return () => clearInterval(interval);
  }, [refreshVisitorStats]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    try {
      localStorage.setItem('ellix_theme', theme);
    } catch {
      // ignore storage errors
    }
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.add('light', 'theme-light');
      root.classList.remove('dark');
      body?.classList.add('light', 'theme-light');
      body?.classList.remove('dark');
    } else {
      root.classList.remove('light', 'theme-light');
      root.classList.add('dark');
      body?.classList.remove('light', 'theme-light');
      body?.classList.add('dark');
    }
    try {
      window.dispatchEvent(new CustomEvent('ellix-theme-sync', { detail: theme }));
    } catch {
      // ignore event errors
    }
  }, [theme]);

  useEffect(() => {
    const handleThemeSync = (e: Event) => {
      const nextTheme = (e as CustomEvent<'dark' | 'light'>).detail;
      if (nextTheme === 'light' || nextTheme === 'dark') {
        setTheme(prev => (prev !== nextTheme ? nextTheme : prev));
      }
    };
    window.addEventListener('ellix-theme-sync', handleThemeSync);
    return () => window.removeEventListener('ellix-theme-sync', handleThemeSync);
  }, []);

  // Sync store-scoped state to local storage using non-blocking deferred writes (with synchronous flush on read/unload)
  const pendingStorageWritesRef = React.useRef<Map<string, any>>(new Map());
  const storageTimerRef = React.useRef<number | null>(null);

  const flushPendingStorageWrites = React.useCallback(() => {
    if (storageTimerRef.current !== null) {
      window.clearTimeout(storageTimerRef.current);
      storageTimerRef.current = null;
    }
    if (pendingStorageWritesRef.current.size === 0) return;
    pendingStorageWritesRef.current.forEach((val, key) => {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch {
        // ignore quota errors
      }
    });
    pendingStorageWritesRef.current.clear();
  }, []);

  const scheduleStorageWrite = React.useCallback((key: string, value: any) => {
    const sanitizedValue =
      !isDemoMode && Array.isArray(value) && !key.startsWith('ellix_invoice_templates_')
        ? stripMockFixtures(value)
        : value;
    pendingStorageWritesRef.current.set(key, sanitizedValue);
    if (storageTimerRef.current !== null) return;
    storageTimerRef.current = window.setTimeout(() => {
      storageTimerRef.current = null;
      flushPendingStorageWrites();
    }, 120);
  }, [isDemoMode, flushPendingStorageWrites]);

  useEffect(() => {
    if (isDemoMode) return;
    window.addEventListener('beforeunload', flushPendingStorageWrites);
    return () => {
      window.removeEventListener('beforeunload', flushPendingStorageWrites);
      flushPendingStorageWrites();
    };
  }, [isDemoMode, flushPendingStorageWrites]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_products_${activeStore.id}`, products);
  }, [isDemoMode, products, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_connections_${activeStore.id}`, connections);
  }, [isDemoMode, connections, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_customers_${activeStore.id}`, customers);
  }, [isDemoMode, customers, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_invoices_${activeStore.id}`, invoices);
  }, [isDemoMode, invoices, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_restock_orders_${activeStore.id}`, restockOrders);
  }, [isDemoMode, restockOrders, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_customer_orders_${activeStore.id}`, customerOrders);
  }, [isDemoMode, customerOrders, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_employees_${activeStore.id}`, employees);
  }, [isDemoMode, employees, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_notifications_${activeStore.id}`, notifications);
  }, [isDemoMode, notifications, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_audit_logs_${activeStore.id}`, auditLogs);
  }, [isDemoMode, auditLogs, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_wholesalers_${activeStore.id}`, wholesalers);
  }, [isDemoMode, wholesalers, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_invoice_templates_${activeStore.id}`, invoiceTemplates);
  }, [isDemoMode, invoiceTemplates, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_suppliers_${activeStore.id}`, suppliers);
  }, [isDemoMode, suppliers, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode || hydratedStoreIdRef.current !== activeStore.id) return;
    scheduleStorageWrite(`ellix_restock_logs_${activeStore.id}`, restockLogs);
  }, [isDemoMode, restockLogs, activeStore.id, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode) return;
    scheduleStorageWrite('ellix_business_applications', businessApplications);
  }, [isDemoMode, businessApplications, scheduleStorageWrite]);

  useEffect(() => {
    if (isDemoMode) return;
    scheduleStorageWrite(`ellix_subscription_${activeClientId}`, subscription);
  }, [isDemoMode, subscription, activeClientId, scheduleStorageWrite]);

  const { currentUser: rawAuthUser, userProfile: rawUserProfile } = useAuth();
  const authUser = isDemoMode ? null : rawAuthUser;
  const userProfile = isDemoMode ? null : rawUserProfile;

  // Map userProfile.role to canonical UserRole (fail-closed to 'unauthorized' for unknown or deactivated users)
  const mapProfileRoleToUserRole = (pRole: unknown, profile?: typeof userProfile): UserRole => {
    if (profile && isUserStatusInactive(profile)) {
      return 'unauthorized';
    }
    return normalizeCanonicalRole(pRole);
  };

  // Authoritative activeRole: for any authenticated user, activeRole is strictly bound to their canonical profile role
  const activeRole: UserRole = (!isDemoMode && authUser)
    ? (userProfile ? mapProfileRoleToUserRole(userProfile.role, userProfile) : 'customer')
    : activeRoleState;

  const canonicalRole = normalizeCanonicalRole(activeRole);
  const isPlatformAdminRole = canonicalRole === 'super_admin' || canonicalRole === 'ellix_admin';
  const isAuthorizedOwnerOrAdmin = isPlatformAdminRole || canonicalRole === 'client';
  const isCrewRole = canonicalRole === 'crew';
  const isWholesalerRole = canonicalRole === 'wholesaler_admin';

  const setActiveRole = (requestedRole: UserRole) => {
    if (isDemoMode) {
      setActiveRoleState(normalizeCanonicalRole(requestedRole));
      return;
    }
    // Disallow manual role elevation for any authenticated non-super-admin user
    if (authUser) {
      if (userProfile && mapProfileRoleToUserRole(userProfile.role, userProfile) === 'super_admin' && (import.meta as any).env?.DEV) {
        setActiveRoleState(normalizeCanonicalRole(requestedRole));
        return;
      }
      if (userProfile) {
        setActiveRoleState(mapProfileRoleToUserRole(userProfile.role, userProfile));
      }
      return;
    }
    setActiveRoleState(normalizeCanonicalRole(requestedRole));
  };

  const handleSetActiveModule = React.useCallback((requestedModule: ActiveModule) => {
    if (!isDemoMode && authUser) {
      if (canonicalRole === 'unauthorized') return;
      if (canonicalRole === 'customer' && requestedModule !== 'customer') {
        console.warn('[RBAC] Denied module switch away from customer for customer role');
        return;
      }
      if (requestedModule === 'admin' && !isPlatformAdminRole) {
        console.warn('[RBAC] Denied module switch to admin for role:', canonicalRole);
        return;
      }
      if (requestedModule === 'wholesaler' && isCrewRole) {
        console.warn('[RBAC] Denied module switch to wholesaler for crew role');
        return;
      }
      if (requestedModule === 'retailer' && (isWholesalerRole || canonicalRole === 'ellix_admin')) {
        console.warn('[RBAC] Denied module switch to retailer for role:', canonicalRole);
        return;
      }
    }
    setActiveModule(requestedModule);
  }, [isDemoMode, authUser, canonicalRole, isPlatformAdminRole, isCrewRole, isWholesalerRole]);

  // Synchronize activeRole and activeModule with authenticated userProfile role
  useEffect(() => {
    if (userProfile) {
      const resolved = mapProfileRoleToUserRole(userProfile.role, userProfile);
      setActiveRoleState(resolved);
      if (resolved === 'super_admin' || resolved === 'ellix_admin') {
        setActiveModule('admin');
      } else if (resolved === 'wholesaler_admin') {
        setActiveModule('wholesaler');
      } else if (resolved === 'customer') {
        setActiveModule('customer');
      } else {
        setActiveModule('retailer');
      }
    }
  }, [userProfile?.role, userProfile?.status, userProfile?.disabled]);

  // Store-level & Tenant-level access check helper
  const canUserAccessStore = React.useCallback((storeObj: Store | undefined): boolean => {
    if (!storeObj) return false;
    if (isDemoMode || !authUser) return true;
    if (canonicalRole === 'unauthorized') return false;
    if (isPlatformAdminRole || isWholesalerRole || canonicalRole === 'customer') return true;
    const assignedIds = userProfile?.assignedStoreIds;
    if (isCrewRole) {
      if (Array.isArray(assignedIds) && assignedIds.length > 0) {
        return assignedIds.includes(storeObj.id);
      }
      return storeObj.id === 'store-1';
    }
    if (canonicalRole === 'client') {
      const userClientId = userProfile?.clientId;
      if (userClientId && storeObj.clientId && storeObj.clientId !== userClientId && userClientId !== 'client-001') {
        if (Array.isArray(assignedIds) && assignedIds.includes(storeObj.id)) {
          return true;
        }
        return false;
      }
      return true;
    }
    return false;
  }, [isDemoMode, authUser, canonicalRole, isPlatformAdminRole, isWholesalerRole, isCrewRole, userProfile?.assignedStoreIds, userProfile?.clientId]);

  const accessibleStores = React.useMemo(() => {
    if (isDemoMode || !authUser) return stores;
    const filtered = stores.filter(st => canUserAccessStore(st));
    return filtered.length > 0 ? filtered : (canonicalRole === 'unauthorized' ? [] : [stores[0] || mockStores[0]]);
  }, [stores, isDemoMode, authUser, canUserAccessStore, canonicalRole]);

  const handleSetActiveStore = React.useCallback((nextStore: Store) => {
    if (!canUserAccessStore(nextStore)) {
      console.warn(`[RBAC] Store switch denied: user (${canonicalRole}) is not assigned to store ${nextStore?.id}`);
      return;
    }
    setActiveStore(nextStore);
  }, [canUserAccessStore, canonicalRole]);

  // Ensure activeStore is always an authorized store when userProfile or assignedStoreIds change
  useEffect(() => {
    if (!isDemoMode && authUser && accessibleStores.length > 0) {
      if (!accessibleStores.some(s => s.id === activeStore.id)) {
        setActiveStore(accessibleStores[0]);
      }
    }
  }, [isDemoMode, authUser, accessibleStores, activeStore.id]);

  const currentUser: User = {
    id: authUser?.uid || (activeRole === 'crew' ? 'emp-3' : 'usr-current'),
    firebaseUid: authUser?.uid,
    name: userProfile?.displayName || authUser?.displayName || (
      isDemoMode
        ? (
            activeRole === 'super_admin' ? 'Akash Joshi (Super Admin)' :
            activeRole === 'ellix_admin' ? 'Siddharth Admin (Ellic)' :
            activeRole === 'crew' ? 'Rahul Sharma' :
            activeRole === 'wholesaler_admin' ? 'Metro Wholesaler Admin' :
            'Vikram Malhotra'
          )
        : (userProfile?.email?.split('@')[0] || authUser?.email?.split('@')[0] || 'Merchant')
    ),
    email: userProfile?.email || authUser?.email || (
      isDemoMode
        ? (
            activeRole === 'super_admin' ? 'superadmin@ellic.com' :
            activeRole === 'ellix_admin' ? 'admin@ellic.com' :
            activeRole === 'crew' ? 'crew@ellic.com' :
            activeRole === 'wholesaler_admin' ? 'wholesaler@ellic.com' :
            'client@ellic.com'
          )
        : ''
    ),
    phone: userProfile?.phoneNumber || authUser?.phoneNumber || (isDemoMode ? '+91 98765 43210' : ''),
    role: activeRole,
    storeId: activeStore.id,
    clientId: userProfile?.clientId || 'client-001',
    assignedStoreIds: userProfile?.assignedStoreIds || (activeRole === 'crew' ? ['store-1', 'store-2'] : ['store-1', 'store-2', 'store-3']),
    wholesalerId: userProfile?.wholesalerId || 'ws-101',
    avatar: authUser?.photoURL || userProfile?.photoURL,
    permissions:
      canonicalRole === 'unauthorized'
        ? []
        : canonicalRole === 'crew'
        ? ['pos_billing', 'inventory_add_restock']
        : canonicalRole === 'wholesaler_admin'
        ? ['wholesaler_portal']
        : ['all'],
    emailVerified: userProfile?.emailVerified || authUser?.emailVerified || false,
    phoneVerified: userProfile?.phoneVerified || Boolean(authUser?.phoneNumber),
    linkedProviders: userProfile?.linkedProviders || authUser?.providerData?.map(p => p.providerId) || [],
    passwordSynchronized: userProfile?.passwordSynchronized || false,
    isRealAuth: Boolean(authUser),
    status: userProfile?.status || 'active'
  };

  const unreadCount = notifications.filter(n => {
    if (n.read) return false;
    if (n.targetRole && n.targetRole !== 'all') {
      if (activeRole === 'crew' && n.targetRole !== 'crew') return false;
      if (activeRole === 'client' && (n.targetRole === 'ellix_admin' || n.targetRole === 'super_admin')) return false;
    }
    return true;
  }).length;

  const addAuditLog = (action: string, details: string, status: AuditLog['status'] = 'success') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user: currentUser.name,
      role: activeRole,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: '127.0.0.1',
      status
    };
    setAuditLogs(prev => [newLog, ...prev]);
    syncManager.syncAuditLog(activeStore.id, newLog);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Firestore Real-Time Live Synchronization Effect
  useEffect(() => {
    // 1. Multi-store & Role-scoped state isolation: Hydrate strictly store-scoped and role-permitted local cache
    setIsDataLoading(true);
    const isDeniedStore = !isDemoMode && authUser && !canUserAccessStore(activeStore);
    if (isDeniedStore || canonicalRole === 'unauthorized') {
      setProducts([]);
      setCustomers([]);
      setInvoices([]);
      setRestockOrders([]);
      setCustomerOrders([]);
      setSuppliers([]);
      setRestockLogs([]);
      setEmployees([]);
      setAuditLogs([]);
      setWholesalers([]);
      setConnections([]);
      setNotifications([]);
      setIsDataLoading(false);
      return;
    }

    const isCustomerRole = canonicalRole === 'customer';
    const cachedProducts = loadStoreScopedCache('ellix_products', activeStore.id, mockProducts);
    setProducts(
      !isDemoMode && authUser && isWholesalerRole
        ? cachedProducts.filter(p => p.sharedWithWholesalers === true)
        : !isDemoMode && authUser && isCustomerRole
          ? cachedProducts.map(p => ({ ...p, purchasePrice: 0 }))
          : cachedProducts
    );

    if (!isDemoMode && authUser && (isCrewRole || isWholesalerRole || isCustomerRole)) {
      setCustomers([]);
      setCustomerOrders(isCustomerRole ? loadStoreScopedCache('ellix_customer_orders', activeStore.id, mockCustomerOrders) : []);
      setEmployees([]);
      setAuditLogs([]);
      setWholesalers([]);
      setConnections([]);
    } else {
      setCustomers(loadStoreScopedCache('ellix_customers', activeStore.id, mockCustomers));
      setCustomerOrders(loadStoreScopedCache('ellix_customer_orders', activeStore.id, mockCustomerOrders));
      setEmployees(loadStoreScopedCache('ellix_employees', activeStore.id, mockEmployees));
      setAuditLogs(loadStoreScopedCache('ellix_audit_logs', activeStore.id, mockAuditLogs));
      setWholesalers(loadStoreScopedCache('ellix_wholesalers', activeStore.id, mockWholesalers));
      setConnections(loadStoreScopedCache('ellix_connections', activeStore.id, mockConnections));
    }

    const cachedStoreInvoices = loadStoreScopedCache('ellix_invoices', activeStore.id, mockInvoices);
    reconcileStoreInvoiceCounter(activeStore.id, cachedStoreInvoices);
    if (!isDemoMode && authUser && (isWholesalerRole || isCustomerRole)) {
      setInvoices([]);
    } else if (!isDemoMode && authUser && isCrewRole) {
      const uid = userProfile?.uid || authUser.uid;
      setInvoices(cachedStoreInvoices.filter(inv => inv.cashierId === uid || inv.createdById === uid));
    } else {
      setInvoices(cachedStoreInvoices);
    }

    if (!isDemoMode && authUser && (isCrewRole || isCustomerRole)) {
      setRestockOrders([]);
    } else {
      setRestockOrders(loadStoreScopedCache('ellix_restock_orders', activeStore.id, mockRestockOrders));
    }

    if (!isDemoMode && authUser && (isWholesalerRole || isCustomerRole)) {
      setSuppliers([]);
      setRestockLogs([]);
    } else {
      setSuppliers(loadStoreScopedCache('ellix_suppliers', activeStore.id, mockSuppliers));
      setRestockLogs(loadStoreScopedCache('ellix_restock_logs', activeStore.id, mockRestockLogs));
    }

    setNotifications(loadStoreScopedCache('ellix_notifications', activeStore.id, mockNotifications));
    hydratedStoreIdRef.current = activeStore.id;

    if (!authUser || isDemoMode) {
      setIsDataLoading(false);
      return;
    }

    const unsub = syncManager.subscribeToStore(
      activeStore.id,
      {
        onInitialDataLoaded: () => {
          setIsDataLoading(false);
        },
        onProductsUpdate: (cloudProducts) => {
          setProducts(cloudProducts || []);
        },
        onCustomersUpdate: (cloudCustomers) => {
          setCustomers(cloudCustomers || []);
        },
        onInvoicesUpdate: (cloudInvoices) => {
          const list = cloudInvoices || [];
          reconcileStoreInvoiceCounter(activeStore.id, list);
          setInvoices(list);
        },
        onRestockOrdersUpdate: (cloudOrders) => {
          setRestockOrders(cloudOrders || []);
        },
        onCustomerOrdersUpdate: (cloudCustomerOrders) => {
          setCustomerOrders(cloudCustomerOrders || []);
        },
        onSuppliersUpdate: (cloudSuppliers) => {
          setSuppliers(cloudSuppliers || []);
        },
        onRestockLogsUpdate: (cloudRestockLogs) => {
          setRestockLogs(cloudRestockLogs || []);
        },
        onAuditLogsUpdate: (cloudLogs) => {
          setAuditLogs(cloudLogs || []);
        },
        onWholesalersUpdate: (cloudWholesalers) => {
          setWholesalers(cloudWholesalers || []);
        },
        onEmployeesUpdate: (cloudEmployees) => {
          setEmployees(cloudEmployees || []);
        },
        onSaveFeedback: (feedback) => {
          setSaveFeedback(feedback);
        },
        onSyncStateChange: (stateUpdate) => {
          setCloudSyncState(prev => ({
            ...prev,
            ...stateUpdate,
            syncedCounts: {
              products: products.length,
              customers: customers.length,
              invoices: invoices.length,
              restockOrders: restockOrders.length,
              customerOrders: customerOrders.length
            }
          }));
        }
      },
      {
        userUid: userProfile?.uid || currentUser.id,
        userRole: canonicalRole
      }
    );

    return () => unsub();
  }, [activeStore.id, authUser?.uid, isDemoMode, userProfile?.uid, canonicalRole, canUserAccessStore]);

  // Real-Time WebSocket Inventory Synchronization Effect (Retailer <-> Wholesaler <-> Customer)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (canonicalRole === 'unauthorized' || canonicalRole === 'ellix_admin') {
      inventorySocket.disconnect();
      return;
    }
    if (!isDemoMode && !authUser) {
      inventorySocket.disconnect();
      return;
    }

    const party: WebSocketParty =
      activeModule === 'wholesaler' || isWholesalerRole
        ? 'wholesaler'
        : activeModule === 'customer' || canonicalRole === 'customer'
        ? 'customer'
        : activeModule === 'admin'
        ? 'admin'
        : 'retailer';

    inventorySocket.setListeners({
      onStatusChange: (status) => {
        setWsStatus(status);
      },
      onPresence: (presence) => {
        setWsPresence(presence);
      },
      onSnapshot: (snapshot) => {
        if (snapshot.storeId !== activeStore.id) return;
        if (Array.isArray(snapshot.products) && (snapshot.products.length > 0 || isDemoMode || party === 'customer')) {
          setProducts(snapshot.products);
        }
        if (Array.isArray(snapshot.wholesalerProducts) && (snapshot.wholesalerProducts.length > 0 || isDemoMode)) {
          setWholesalerProducts(snapshot.wholesalerProducts);
        }
        if (Array.isArray(snapshot.restockOrders) && (snapshot.restockOrders.length > 0 || isDemoMode) && party !== 'customer') {
          setRestockOrders(snapshot.restockOrders);
        }
        if (Array.isArray(snapshot.customerOrders) && (snapshot.customerOrders.length > 0 || isDemoMode) && party !== 'wholesaler') {
          setCustomerOrders(snapshot.customerOrders);
        }
      },
      onDelta: (delta) => {
        if (delta.storeId !== activeStore.id) return;
        setProducts(prev => {
          const removedSet = new Set(delta.removedProductIds || []);
          const updatedMap = new Map<string, Product>(
            (delta.updatedProducts || []).map(p => [p.id, p])
          );
          const nextList: Product[] = [];
          const seen = new Set<string>();

          for (const existing of prev) {
            if (removedSet.has(existing.id)) continue;
            const updated = updatedMap.get(existing.id);
            if (updated) {
              nextList.push({ ...existing, ...updated });
              seen.add(existing.id);
            } else {
              nextList.push(existing);
              seen.add(existing.id);
            }
          }
          for (const [id, up] of updatedMap.entries()) {
            if (!seen.has(id) && !removedSet.has(id)) {
              nextList.unshift(up);
            }
          }
          return nextList;
        });
      },
      onAuthoritativeProductsSync: (authProducts) => {
        if (!Array.isArray(authProducts) || authProducts.length === 0) return;
        const map = new Map(authProducts.map(p => [p.id, p]));
        setProducts(prev => prev.map(p => (map.has(p.id) ? { ...p, ...map.get(p.id)! } : p)));
      },
      onRestockOrderUpdated: (order) => {
        if (!order?.id) return;
        setRestockOrders(prev => {
          const exists = prev.some(o => o.id === order.id);
          if (exists) {
            return prev.map(o => (o.id === order.id ? { ...o, ...order } : o));
          }
          return [order, ...prev];
        });
      },
      onCustomerOrderUpdated: (order) => {
        if (!order?.id || order.storeId !== activeStore.id) return;
        setCustomerOrders(prev => {
          const exists = prev.some(o => o.id === order.id);
          if (exists) {
            return prev.map(o => (o.id === order.id ? { ...o, ...order } : o));
          }
          return [order, ...prev];
        });
      },
      onInvoiceSynced: ({ invoice, customer, auditLog }) => {
        if (!invoice?.id || invoice.storeId !== activeStore.id) return;
        reconcileStoreInvoiceCounter(activeStore.id, [invoice]);
        setInvoices(prev => {
          if (prev.some(inv => inv.id === invoice.id)) return prev;
          return [invoice, ...prev];
        });
        if (customer?.id) {
          setCustomers(prev => prev.map(c => (c.id === customer.id ? { ...c, ...customer } : c)));
        }
        if (auditLog?.id) {
          setAuditLogs(prev => (prev.some(l => l.id === auditLog.id) ? prev : [auditLog, ...prev]));
        }
      },
      onWholesalerCatalogDelta: (updatedWsProducts) => {
        if (!Array.isArray(updatedWsProducts) || updatedWsProducts.length === 0) return;
        const map = new Map(updatedWsProducts.map(wp => [wp.id, wp]));
        setWholesalerProducts(prev => {
          const next = prev.map(wp => (map.has(wp.id) ? { ...wp, ...map.get(wp.id)! } : wp));
          for (const [id, wp] of map.entries()) {
            if (!next.some(item => item.id === id)) {
              next.push(wp);
            }
          }
          return next;
        });
      }
    });

    void inventorySocket.connect({
      mode: isDemoMode ? 'demo' : 'live',
      storeId: activeStore.id,
      party,
      getIdToken: authUser ? () => authUser.getIdToken() : undefined,
      getInitialState: () => ({
        products: productsRef.current,
        wholesalerProducts: wholesalerProductsRef.current,
        restockOrders: restockOrdersRef.current,
        customerOrders: customerOrdersRef.current
      })
    });

    return () => {
      // keep socket alive across module transitions within same session; cleanup happens on unmount/auth loss
    };
  }, [activeStore.id, activeModule, isDemoMode, authUser?.uid, canonicalRole, isWholesalerRole]);

  useEffect(() => {
    return () => {
      inventorySocket.disconnect();
    };
  }, []);

  // Real-Time Client Subscription State Sync (Firestore Authoritative)
  useEffect(() => {
    const clientId = activeStore.clientId || 'client-001';
    if (!isFirestoreAvailable || !firestoreDb || !authUser) return;

    try {
      const subDocRef = doc(firestoreDb, 'clients', clientId, 'subscription', 'current');
      const unsubSub = onSnapshot(
        subDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const now = Date.now();
            let status = data.status || 'active';
            const renewalStr = data.renewalDate || data.renewal_date;

            // Authoritative state transitions: Active, Grace Period, Blocked
            if (renewalStr && status !== 'cancelled') {
              const renewalTime = new Date(renewalStr).getTime();
              const gracePeriodEnd = renewalTime + 7 * 86400000; // 7 days grace period
              if (now > renewalTime) {
                if (now <= gracePeriodEnd) {
                  status = 'grace_period';
                } else {
                  status = 'blocked';
                }
              }
            }

            setSubscription(prev => ({
              ...prev,
              name: data.plan || data.name || prev.name,
              status,
              renewalDate: renewalStr || prev.renewalDate,
              priceMonthly: data.priceMonthly || data.amount || prev.priceMonthly,
              lastPaymentDate: data.lastPaymentDate || prev.lastPaymentDate
            }));
          }
        },
        (err) => console.warn('[StoreContext] Subscription sync warning:', err.message)
      );

      return () => unsubSub();
    } catch (e) {
      console.warn('[StoreContext] Failed to setup subscription sync listener:', e);
    }
  }, [activeStore.clientId, isFirestoreAvailable]);

  const forceCloudSync = async () => {
    if (isDemoMode) return;
    setIsDataLoading(true);
    setCloudSyncState(prev => ({ ...prev, status: 'syncing' }));
    try {
      await syncManager.flushQueue();
      const realProducts = stripMockFixtures(products);
      const realCustomers = stripMockFixtures(customers);
      const realInvoices = stripMockFixtures(invoices);
      const realRestockOrders = stripMockFixtures(restockOrders);
      const realCustomerOrders = stripMockFixtures(customerOrders);
      if (realProducts.length > 0) {
        await syncManager.seedProducts(activeStore.id, realProducts);
      }
      if (realCustomers.length > 0) {
        await syncManager.seedCustomers(activeStore.id, realCustomers);
      }
      if (realInvoices.length > 0) {
        await syncManager.seedInvoices(activeStore.id, realInvoices);
      }
      if (realRestockOrders.length > 0) {
        await syncManager.seedRestockOrders(activeStore.id, realRestockOrders);
      }
      if (realCustomerOrders.length > 0) {
        await syncManager.seedCustomerOrders(activeStore.id, realCustomerOrders);
      }
      setCloudSyncState(prev => ({
        ...prev,
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
        pendingCount: getOfflineQueue().length,
        lastError: null,
        syncedCounts: {
          products: realProducts.length,
          customers: realCustomers.length,
          invoices: realInvoices.length,
          restockOrders: realRestockOrders.length,
          customerOrders: realCustomerOrders.length
        }
      }));
      addNotification({
        title: 'Cloud Database Synchronized',
        message: 'All inventory items, POS invoices, and records are fully synced with Firestore without any data loss.',
        category: 'system',
        linkModule: 'retailer'
      });
    } catch (e: any) {
      setCloudSyncState(prev => ({
        ...prev,
        status: 'error',
        lastError: e?.message || 'Sync failed'
      }));
    } finally {
      setTimeout(() => {
        setIsDataLoading(false);
      }, 350);
    }
  };

  // Product Actions
  const addProduct = (productData: Omit<Product, 'id'>) => {
    if (!isDemoMode && authUser && (canonicalRole === 'unauthorized' || isWholesalerRole || canonicalRole === 'customer' || !canUserAccessStore(activeStore))) {
      console.warn('[RBAC] Unauthorized addProduct blocked');
      return;
    }
    const sanitizedData = isCrewRole
      ? { ...productData, sharedWithWholesalers: false }
      : productData;
    const newProduct: Product = {
      ...sanitizedData,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProduct, ...prev]);
    syncManager.syncProduct(activeStore.id, newProduct);
    void inventorySocket
      .sendMutation('product:upsert', { product: newProduct }, { queueIfOffline: true })
      .catch(() => {});
    addAuditLog('Add Product', `Added product: ${newProduct.name} (Stock: ${newProduct.stock})`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (!isDemoMode && authUser && (canonicalRole === 'unauthorized' || isWholesalerRole || canonicalRole === 'customer' || !canUserAccessStore(activeStore))) {
      console.warn('[RBAC] Unauthorized updateProduct blocked');
      return;
    }
    let updatedProductForWs: Product | null = null;
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        if (!isDemoMode && authUser && isCrewRole) {
          // Crew can only increase stock via restock and cannot toggle wholesaler sharing or reduce stock manually
          if (updates.stock !== undefined && updates.stock < p.stock) {
            console.warn('[RBAC] Crew cannot manually reduce product stock');
            return p;
          }
          const { sharedWithWholesalers: _ignoredSharing, ...crewSafeUpdates } = updates;
          const updated = { ...p, ...crewSafeUpdates };
          updatedProductForWs = updated;
          syncManager.syncProduct(activeStore.id, updated);
          return updated;
        }
        const updated = { ...p, ...updates };
        updatedProductForWs = updated;
        syncManager.syncProduct(activeStore.id, updated);
        // Check low stock threshold trigger
        if (updated.stock <= updated.minThreshold && p.stock > p.minThreshold) {
          addNotification({
            title: `Low Stock Alert: ${updated.name}`,
            message: `Current stock (${updated.stock}) is below threshold (${updated.minThreshold}).`,
            category: 'low_stock',
            linkModule: 'retailer'
          });
        }
        return updated;
      }
      return p;
    }));
    if (updatedProductForWs) {
      void inventorySocket
        .sendMutation('product:upsert', { product: updatedProductForWs }, { queueIfOffline: true })
        .catch(() => {});
    }
    addAuditLog('Update Product', `Updated product ID ${id}`);
  };

  const deleteProduct = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can delete products');
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    syncManager.deleteProduct(activeStore.id, id);
    void inventorySocket
      .sendMutation('product:delete', { productId: id }, { queueIfOffline: true })
      .catch(() => {});
    addAuditLog('Delete Product', `Deleted product ID ${id}`);
  };

  const toggleProductSharing = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can toggle wholesaler product sharing');
      return;
    }
    let updatedProductForWs: Product | null = null;
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updatedShare = !p.sharedWithWholesalers;
        const updated = { ...p, sharedWithWholesalers: updatedShare };
        updatedProductForWs = updated;
        syncManager.syncProduct(activeStore.id, updated);
        addAuditLog('Product Wholesaler Sharing Toggled', `${p.name} sharing set to ${updatedShare ? 'Enabled' : 'Disabled'}`);
        return updated;
      }
      return p;
    }));
    if (updatedProductForWs) {
      void inventorySocket
        .sendMutation('product:upsert', { product: updatedProductForWs }, { queueIfOffline: true })
        .catch(() => {});
    }
  };

  const updateWholesalerProductStock = (id: string, stockAvailable: number) => {
    if (!isDemoMode && authUser && !isWholesalerRole && !isPlatformAdminRole) {
      console.warn('[RBAC] Forbidden: Only wholesalers or admins can update wholesaler catalog stock');
      return;
    }
    const cleanStock = Math.max(0, Math.floor(Number(stockAvailable) || 0));
    let updatedItem: WholesalerProduct | null = null;
    setWholesalerProducts(prev =>
      prev.map(wp => {
        if (wp.id === id) {
          updatedItem = { ...wp, stockAvailable: cleanStock };
          return updatedItem;
        }
        return wp;
      })
    );
    if (updatedItem) {
      void inventorySocket
        .sendMutation('wholesaler:catalog_update', { product: updatedItem }, { queueIfOffline: true })
        .catch(() => {});
      addAuditLog('Wholesaler Stock Updated', `Updated ${(updatedItem as WholesalerProduct).name} available stock to ${cleanStock}`);
    }
  };

  // Billing POS Invoice (Concurrency-Safe & Transactional)
  const createInvoice = async (
    invoiceData: Omit<POSInvoice, 'id' | 'invoiceNumber'> & { id?: string }
  ): Promise<POSInvoice> => {
    if (!isDemoMode && authUser && (canonicalRole === 'unauthorized' || isWholesalerRole || !canUserAccessStore(activeStore))) {
      throw new Error('Forbidden: Current role is not authorized to create POS invoices for this store.');
    }
    if (!isDemoMode && authUser && isCrewRole) {
      const hasInvoiceDiscount = Number(invoiceData.discountTotal || 0) > 0 || Number(invoiceData.discountAmount || 0) > 0 || Number(invoiceData.discountPercent || 0) > 0;
      const hasItemDiscount = Array.isArray(invoiceData.items) && invoiceData.items.some(it => Number(it.discount || 0) > 0);
      if (hasInvoiceDiscount || hasItemDiscount) {
        throw new Error('Forbidden: Crew members are not authorized to apply discounts.');
      }
      if (Number(invoiceData.loyaltyPointsRedeemed || 0) > 0) {
        throw new Error('Forbidden: Crew members are not authorized to redeem customer loyalty points.');
      }
    }
    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new InsufficientStockError('Cannot create an invoice with an empty cart.');
    }

    const targetStoreId = invoiceData.storeId || activeStore.id;
    const requestedId = invoiceData.id?.trim();

    // Idempotency guard for retries with the same invoice ID
    if (requestedId) {
      const alreadyCreated = invoicesRef.current.find(
        inv => inv.id === requestedId && (!inv.storeId || inv.storeId === targetStoreId)
      );
      if (alreadyCreated) {
        return alreadyCreated;
      }
      const inFlightTask = inFlightInvoiceTasksRef.current.get(requestedId);
      if (inFlightTask) {
        return inFlightTask;
      }
    }

    // 1. Aggregate requested quantities per productId
    const requestedByProduct = new Map<string, { quantity: number; productName: string }>();
    for (const item of invoiceData.items) {
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new InsufficientStockError(
          `Invalid sale quantity (${item.quantity}) for "${item.productName || item.productId}".`,
          { productId: item.productId, requestedQuantity: qty }
        );
      }
      const existing = requestedByProduct.get(item.productId);
      requestedByProduct.set(item.productId, {
        quantity: (existing?.quantity || 0) + qty,
        productName: item.productName || existing?.productName || item.productId
      });
    }

    // 2. Synchronous check against productsRef.current minus any in-flight reservations
    //    Prevents negative stock and blocks simultaneous same-terminal sales before any await
    const currentProductsSnapshot = productsRef.current;
    for (const [productId, req] of requestedByProduct.entries()) {
      const prod = currentProductsSnapshot.find(p => p.id === productId);
      const reservedQty = inFlightReservedStockRef.current.get(productId) || 0;
      const availableStock = prod ? Math.max(0, Number(prod.stock ?? 0) - reservedQty) : 0;
      if (!prod || !Number.isFinite(availableStock) || availableStock < req.quantity) {
        const err = new InsufficientStockError(
          `Insufficient stock for "${prod?.name || req.productName}": only ${availableStock} available, requested ${req.quantity}.`,
          {
            productId,
            availableStock,
            requestedQuantity: req.quantity
          }
        );
        addNotification({
          title: 'Sale Rejected: Insufficient Stock',
          message: err.message,
          category: 'low_stock',
          linkModule: 'retailer'
        });
        throw err;
      }
    }

    // 3. Synchronously reserve stock in inFlightReservedStockRef before any await
    for (const [productId, req] of requestedByProduct.entries()) {
      const prevReserved = inFlightReservedStockRef.current.get(productId) || 0;
      inFlightReservedStockRef.current.set(productId, prevReserved + req.quantity);
    }

    const releaseReservation = () => {
      for (const [productId, req] of requestedByProduct.entries()) {
        const currentReserved = inFlightReservedStockRef.current.get(productId) || 0;
        const nextReserved = Math.max(0, currentReserved - req.quantity);
        if (nextReserved === 0) {
          inFlightReservedStockRef.current.delete(productId);
        } else {
          inFlightReservedStockRef.current.set(productId, nextReserved);
        }
      }
    };

    invoiceSeqRef.current += 1;
    const uniqueSuffix = `${invoiceSeqRef.current}-${Math.random().toString(36).slice(2, 7)}`;
    const invoiceId = requestedId || `inv-${Date.now()}-${uniqueSuffix}`;
    const tentativeInvoiceNumber = reserveStoreInvoiceNumber(
      targetStoreId,
      invoiceId,
      invoiceData.date,
      invoicesRef.current
    );

    const newInvoice: POSInvoice = {
      ...invoiceData,
      id: invoiceId,
      invoiceNumber: tentativeInvoiceNumber,
      storeId: targetStoreId,
      clientId: invoiceData.clientId || activeStore.clientId || 'client-001',
      createdBy: currentUser.name,
      createdById: currentUser.id,
      cashierName: currentUser.name,
      cashierId: currentUser.id,
      paymentStatus: 'paid'
    };

    const executeCreation = async (): Promise<POSInvoice> => {
      // Prepare preview of updated products for offline/unseeded fallback
      const previewUpdatedProducts: Product[] = [];
      for (const p of currentProductsSnapshot) {
        const req = requestedByProduct.get(p.id);
        if (req) {
          const reservedTotal = inFlightReservedStockRef.current.get(p.id) || req.quantity;
          previewUpdatedProducts.push({
            ...p,
            stock: Math.max(0, p.stock - reservedTotal)
          });
        }
      }

      // Prepare Customer loyalty, totalPurchases & creditBalance update if customer linked
      let updatedCustObj: CustomerProfile | undefined = undefined;
      if (newInvoice.customerId || newInvoice.customerPhone) {
        const matchedCustomer = customersRef.current.find(
          c =>
            (newInvoice.customerId && c.id === newInvoice.customerId) ||
            (newInvoice.customerPhone && c.phone === newInvoice.customerPhone)
        );
        if (matchedCustomer) {
          newInvoice.customerId = matchedCustomer.id;
          const creditDelta = newInvoice.paymentMethod === 'credit' ? Number(newInvoice.grandTotal || 0) : 0;
          updatedCustObj = {
            ...matchedCustomer,
            totalPurchases: Number(((Number(matchedCustomer.totalPurchases) || 0) + newInvoice.grandTotal).toFixed(2)),
            loyaltyPoints: Math.max(
              0,
              (Number(matchedCustomer.loyaltyPoints) || 0) -
                (newInvoice.loyaltyPointsRedeemed || 0) +
                (newInvoice.loyaltyPointsEarned || 0)
            ),
            creditBalance: Number(((Number(matchedCustomer.creditBalance) || 0) + creditDelta).toFixed(2))
          };
        }
      }

      const auditLogObj: AuditLog = {
        id: `log-${invoiceId}`,
        user: currentUser.name,
        role: activeRole,
        action: 'POS Invoice Created',
        details: `Invoice ${newInvoice.invoiceNumber} created for ${newInvoice.customerName} (₹${newInvoice.grandTotal}) at ${activeStore.name}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ipAddress: '127.0.0.1',
        status: 'success'
      };

      // 4. Server-authoritative WebSocket lock + Firestore transaction atomic stock verification
      let txCommittedProducts: Product[] | undefined;
      try {
        if (inventorySocket.isReady()) {
          const wsAck = await inventorySocket.sendMutation<{
            invoice: POSInvoice;
            updatedProducts: Product[];
          }>(
            'pos:sale',
            {
              invoice: newInvoice,
              customer: updatedCustObj,
              auditLog: auditLogObj
            },
            { requestId: `pos-${invoiceId}` }
          );
          if (Array.isArray(wsAck?.updatedProducts)) {
            txCommittedProducts = wsAck.updatedProducts;
          }
          // Ensure Firestore persistence if server ran without ADC credentials
          if (!isDemoMode) {
            try {
              const firestoreProds = await syncManager.syncPOSSaleAtomic(
                targetStoreId,
                newInvoice,
                txCommittedProducts || previewUpdatedProducts,
                updatedCustObj,
                auditLogObj
              );
              if (Array.isArray(firestoreProds) && firestoreProds.length > 0) {
                txCommittedProducts = firestoreProds;
              }
            } catch (fsErr: any) {
              if (isInsufficientStockError(fsErr)) {
                throw fsErr;
              }
              // Non-stock Firestore offline fallback already persisted via server WS
            }
          }
        } else {
          txCommittedProducts = await syncManager.syncPOSSaleAtomic(
            targetStoreId,
            newInvoice,
            previewUpdatedProducts,
            updatedCustObj,
            auditLogObj
          );
        }
      } catch (err: any) {
        releaseReservation();
        releaseStoreInvoiceNumberReservation(targetStoreId, invoiceId);
        if (isInsufficientStockError(err) && err.productId && typeof err.availableStock === 'number') {
          const remoteStock = Math.max(0, err.availableStock);
          setProducts(prev =>
            prev.map(p => (p.id === err.productId ? { ...p, stock: remoteStock } : p))
          );
        }
        addNotification({
          title: isInsufficientStockError(err) ? 'Sale Rejected: Insufficient Stock' : 'Sale Transaction Failed',
          message: err?.message || 'Concurrent sale updated stock levels. Please review cart quantities.',
          category: 'low_stock',
          linkModule: 'retailer'
        });
        throw err;
      }

      // Ensure final committed invoiceNumber is registered in store counter (handles demo mode as well)
      commitStoreInvoiceNumber(targetStoreId, newInvoice.id, newInvoice.invoiceNumber);

      // 5. Commit stock deduction to local state and release in-flight reservation simultaneously
      releaseReservation();

      const committedById = new Map<string, Product>(
        Array.isArray(txCommittedProducts) ? txCommittedProducts.map(p => [p.id, p]) : []
      );
      const lowStockAlerts: { product: Product; newStock: number; isCritical: boolean }[] = [];

      setProducts(prev =>
        prev.map(p => {
          const req = requestedByProduct.get(p.id);
          if (!req) return p;

          const txProd = committedById.get(p.id);
          const newStock =
            txProd && Number.isFinite(Number(txProd.stock))
              ? Math.max(0, Number(txProd.stock))
              : Math.max(0, p.stock - req.quantity);

          const updatedProd: Product = { ...p, stock: newStock };

          // Low stock rule: Warning level <= minThreshold; Critical level <= 3 units
          if (newStock <= p.minThreshold) {
            const isCritical = newStock <= 3;
            lowStockAlerts.push({ product: p, newStock, isCritical });
          }
          return updatedProd;
        })
      );

      // Low stock alert: visible to all, but push notification is dispatched to Client / Owner only
      if (lowStockAlerts.length > 0) {
        lowStockAlerts.forEach(alert => {
          addNotification({
            title: alert.isCritical ? `🚨 CRITICAL Low Stock: ${alert.product.name}` : `⚠️ Low Stock Warning: ${alert.product.name}`,
            message: `Stock level dropped to ${alert.newStock} ${alert.product.unit || 'units'} in ${activeStore.name}. Min threshold is ${alert.product.minThreshold}. Please initiate manual restock.`,
            category: 'low_stock',
            linkModule: 'retailer',
            targetRole: 'client' // Client/Owner push alert
          });
        });
      }

      if (updatedCustObj) {
        const finalCust = updatedCustObj;
        setCustomers(prev => prev.map(c => (c.id === finalCust.id ? finalCust : c)));
      }

      setInvoices(prev => [
        newInvoice,
        ...prev.filter(inv => inv.id !== newInvoice.id)
      ]);
      setAuditLogs(prev => [
        auditLogObj,
        ...prev.filter(l => l.id !== auditLogObj.id)
      ]);

      addNotification({
        title: 'Invoice Generated',
        message: `Invoice #${newInvoice.invoiceNumber} created for ₹${newInvoice.grandTotal} (${newInvoice.paymentMethod.toUpperCase()}).`,
        category: 'payment',
        linkModule: 'retailer'
      });

      return newInvoice;
    };

    const taskPromise = executeCreation().finally(() => {
      inFlightInvoiceTasksRef.current.delete(invoiceId);
    });
    inFlightInvoiceTasksRef.current.set(invoiceId, taskPromise);
    return taskPromise;
  };

  const deleteInvoice = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Crew/Wholesaler cannot delete invoices');
      return;
    }
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    syncManager.deleteInvoice(activeStore.id, id);
    addAuditLog('Invoice Deleted', `Deleted invoice ID ${id}`, 'warning');
  };

  // Invoice Template Actions
  const addInvoiceTemplate = (templateData: Omit<InvoiceTemplate, 'id' | 'createdAt'>): InvoiceTemplate => {
    const newTemplate: InvoiceTemplate = {
      ...templateData,
      id: `tpl-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can manage invoice templates');
      return newTemplate;
    }

    setInvoiceTemplates(prev => {
      let updated = prev;
      if (newTemplate.isDefault) {
        updated = prev.map(t => t.targetSegment === newTemplate.targetSegment ? { ...t, isDefault: false } : t);
      }
      return [newTemplate, ...updated];
    });

    addAuditLog('Invoice Template Created', `Created invoice template: ${newTemplate.name} for ${newTemplate.targetSegment}`);
    return newTemplate;
  };

  const updateInvoiceTemplate = (id: string, updates: Partial<InvoiceTemplate>) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setInvoiceTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      if (updates.isDefault && t.targetSegment === updates.targetSegment) {
        return { ...t, isDefault: false };
      }
      return t;
    }));
    addAuditLog('Invoice Template Updated', `Updated template ID ${id}`);
  };

  const deleteInvoiceTemplate = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setInvoiceTemplates(prev => prev.filter(t => t.id !== id));
    addAuditLog('Invoice Template Deleted', `Deleted template ID ${id}`);
  };

  const setDefaultInvoiceTemplate = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    const target = invoiceTemplates.find(t => t.id === id);
    if (!target) return;
    setInvoiceTemplates(prev => prev.map(t => {
      if (t.id === id) return { ...t, isDefault: true };
      if (t.targetSegment === target.targetSegment) return { ...t, isDefault: false };
      return t;
    }));
    addAuditLog('Default Invoice Template Changed', `Set ${target.name} as default for ${target.targetSegment}`);
  };

  // Restock Purchase Orders (Wholesaler Integration)
  const sendRestockRequest = (productId: string, quantity: number, wholesalerId: string = 'ws-101') => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Crew cannot send B2B wholesaler restock requests');
      return;
    }
    const prod = productsRef.current.find(p => p.id === productId);
    const ws = wholesalers.find(w => w.id === wholesalerId);
    if (!prod) return;

    const newRestockOrder: RestockOrder = {
      id: `ro-${Date.now()}`,
      retailerStoreId: activeStore.id,
      retailerName: activeStore.name,
      wholesalerId: ws?.id || 'ws-101',
      wholesalerName: ws?.name || 'Metro Mega Distribution Pvt Ltd',
      productId: prod.id,
      productName: prod.name,
      suggestedQty: quantity,
      status: 'suggested',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes: `Restock request triggered for ${prod.name} (Stock: ${prod.stock}).`
    };

    setRestockOrders(prev => [newRestockOrder, ...prev]);
    syncManager.syncRestockOrder(activeStore.id, newRestockOrder);
    void inventorySocket
      .sendMutation('restock:order_upsert', { order: newRestockOrder }, { queueIfOffline: true })
      .catch(() => {});

    addNotification({
      title: 'Restock Suggestion Sent',
      message: `Restock request for ${quantity}x ${prod.name} sent to ${newRestockOrder.wholesalerName}.`,
      category: 'restock',
      linkModule: 'wholesaler'
    });

    addAuditLog('Restock Request Sent', `Requested ${quantity} units of ${prod.name} from ${newRestockOrder.wholesalerName}`);
  };

  const updateRestockOrder = (orderId: string, status: RestockOrder['status'], extra?: Partial<RestockOrder>) => {
    if (!isDemoMode && authUser && (isCrewRole || canonicalRole === 'unauthorized' || canonicalRole === 'customer')) {
      console.warn('[RBAC] Forbidden: Current role cannot modify B2B restock orders');
      return;
    }
    let updatedOrderForWs: RestockOrder | null = null;
    const canApplyDeliveryStock = isDemoMode || isAuthorizedOwnerOrAdmin || isWholesalerRole;

    setRestockOrders(prev => prev.map(ro => {
      if (ro.id === orderId) {
        const alreadyApplied = Boolean(ro.stockAppliedOnDelivery);
        const shouldCreditStock = status === 'delivered' && canApplyDeliveryStock && !alreadyApplied;
        const updated: RestockOrder = {
          ...ro,
          status,
          ...extra,
          ...(shouldCreditStock ? { stockAppliedOnDelivery: true } : {})
        };
        updatedOrderForWs = updated;
        syncManager.syncRestockOrder(activeStore.id, updated);

        if (shouldCreditStock) {
          const qtyToAdd = Math.max(0, Number(updated.quotedQty || updated.suggestedQty || 0));
          if (qtyToAdd > 0) {
            setProducts(pList => pList.map(p => {
              if (p.id === ro.productId) {
                const updatedProduct = { ...p, stock: p.stock + qtyToAdd };
                syncManager.syncProduct(activeStore.id, updatedProduct);
                return updatedProduct;
              }
              return p;
            }));

            setWholesalerProducts(wsList => wsList.map(wp => {
              const nameMatch =
                wp.wholesalerId === ro.wholesalerId &&
                (wp.id === ro.productId ||
                  wp.name.trim().toLowerCase() === ro.productName.trim().toLowerCase());
              if (nameMatch) {
                return { ...wp, stockAvailable: Math.max(0, wp.stockAvailable - qtyToAdd) };
              }
              return wp;
            }));
          }

          addNotification({
            title: 'Stock Auto-Updated upon Delivery',
            message: `${updated.quotedQty || updated.suggestedQty} units of ${updated.productName} added to inventory.`,
            category: 'restock',
            linkModule: 'retailer'
          });
        }

        return updated;
      }
      return ro;
    }));

    if (updatedOrderForWs) {
      void inventorySocket
        .sendMutation(
          'restock:order_status',
          {
            orderId,
            status,
            extra,
            order: updatedOrderForWs
          },
          { queueIfOffline: true }
        )
        .catch(() => {});
    }

    addAuditLog('Restock Order Status Updated', `PO #${orderId} set to ${status}`);
  };

  const acceptQuotationAndGeneratePO = (orderId: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    updateRestockOrder(orderId, 'po_created');
    addNotification({
      title: 'PO Generated & Wholesaler Notified',
      message: `Restock quotation accepted for PO #${orderId}. Delivery dispatch pending.`,
      category: 'restock',
      linkModule: 'wholesaler'
    });
  };

  // Customer Orders & Reservations (Atomic WebSocket Stock Deduction)
  const createCustomerOrder = async (
    orderData: Omit<CustomerOrder, 'id' | 'orderNumber' | 'createdAt' | 'pickupQrCode'>
  ): Promise<CustomerOrder> => {
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new InsufficientStockError('Customer order must contain at least one item.');
    }

    // Aggregate requested quantities per product
    const requestedByProduct = new Map<string, { quantity: number; productName: string }>();
    for (const item of orderData.items) {
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new InsufficientStockError(
          `Invalid order quantity (${item.quantity}) for "${item.productName || item.productId}".`,
          { productId: item.productId, requestedQuantity: qty }
        );
      }
      const existing = requestedByProduct.get(item.productId);
      requestedByProduct.set(item.productId, {
        quantity: (existing?.quantity || 0) + qty,
        productName: item.productName || existing?.productName || item.productId
      });
    }

    // Pre-check local inventory snapshot before hitting server
    for (const [productId, req] of requestedByProduct.entries()) {
      const prod = productsRef.current.find(p => p.id === productId);
      const reservedQty = inFlightReservedStockRef.current.get(productId) || 0;
      const availableStock = prod ? Math.max(0, Number(prod.stock ?? 0) - reservedQty) : 0;
      if (!prod || availableStock < req.quantity) {
        throw new InsufficientStockError(
          `Insufficient stock for "${prod?.name || req.productName}": only ${availableStock} available, requested ${req.quantity}.`,
          { productId, availableStock, requestedQuantity: req.quantity }
        );
      }
    }

    // Reserve in-flight quantities synchronously to prevent duplicate click races
    for (const [productId, req] of requestedByProduct.entries()) {
      const prevReserved = inFlightReservedStockRef.current.get(productId) || 0;
      inFlightReservedStockRef.current.set(productId, prevReserved + req.quantity);
    }

    const releaseReservation = () => {
      for (const [productId, req] of requestedByProduct.entries()) {
        const currentReserved = inFlightReservedStockRef.current.get(productId) || 0;
        const nextReserved = Math.max(0, currentReserved - req.quantity);
        if (nextReserved === 0) {
          inFlightReservedStockRef.current.delete(productId);
        } else {
          inFlightReservedStockRef.current.set(productId, nextReserved);
        }
      }
    };

    const ordNumber = `ORD-ELLIC-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrCode = `QR-PICKUP-${ordNumber}`;
    const orderId = `co-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newOrder: CustomerOrder = {
      ...orderData,
      id: orderId,
      orderNumber: ordNumber,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      pickupQrCode: qrCode,
      stockReserved: true
    };

    try {
      let committedProducts: Product[] | undefined;
      if (inventorySocket.isReady()) {
        const ack = await inventorySocket.sendMutation<{
          order: CustomerOrder;
          updatedProducts: Product[];
        }>('customer:order_create', { order: newOrder }, { requestId: `custord-${orderId}` });
        if (Array.isArray(ack?.updatedProducts)) {
          committedProducts = ack.updatedProducts;
        }
      }

      releaseReservation();

      const committedById = new Map<string, Product>(
        Array.isArray(committedProducts) ? committedProducts.map(p => [p.id, p]) : []
      );
      setProducts(prev =>
        prev.map(p => {
          const req = requestedByProduct.get(p.id);
          if (!req) return p;
          const serverProd = committedById.get(p.id);
          const nextStock =
            serverProd && Number.isFinite(Number(serverProd.stock))
              ? Math.max(0, Number(serverProd.stock))
              : Math.max(0, p.stock - req.quantity);
          return { ...p, stock: nextStock };
        })
      );

      setCustomerOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      if (!isDemoMode && isAuthorizedOwnerOrAdmin) {
        syncManager.syncCustomerOrder(activeStore.id, newOrder);
      }

      addNotification({
        title: `New Customer Order (${newOrder.orderType.toUpperCase()})`,
        message: `Order #${ordNumber} received from ${newOrder.customerName} (₹${newOrder.totalAmount}).`,
        category: 'customer_order',
        linkModule: 'retailer'
      });

      addAuditLog('Customer Order Placed', `Order #${ordNumber} created by ${newOrder.customerName}`);
      return newOrder;
    } catch (err: any) {
      releaseReservation();
      if (isInsufficientStockError(err) && err.productId && typeof err.availableStock === 'number') {
        const remoteStock = Math.max(0, err.availableStock);
        setProducts(prev =>
          prev.map(p => (p.id === err.productId ? { ...p, stock: remoteStock } : p))
        );
      }
      throw err;
    }
  };

  const updateCustomerOrderStatus = (orderId: string, status: CustomerOrder['orderStatus']) => {
    let targetOrder: CustomerOrder | null = null;
    setCustomerOrders(prev => prev.map(co => {
      if (co.id === orderId) {
        const shouldRestoreStock =
          status === 'cancelled' && co.orderStatus !== 'cancelled' && co.stockReserved !== false;
        const updated: CustomerOrder = {
          ...co,
          orderStatus: status,
          stockReserved: shouldRestoreStock ? false : co.stockReserved
        };
        targetOrder = updated;
        if (!isDemoMode && isAuthorizedOwnerOrAdmin) {
          syncManager.syncCustomerOrder(activeStore.id, updated);
        }
        if (shouldRestoreStock) {
          setProducts(pList =>
            pList.map(p => {
              const matchedItem = co.items.find(it => it.productId === p.id);
              if (!matchedItem) return p;
              const restored = { ...p, stock: p.stock + Number(matchedItem.quantity || 0) };
              if (!isDemoMode && isAuthorizedOwnerOrAdmin) {
                syncManager.syncProduct(activeStore.id, restored);
              }
              return restored;
            })
          );
        }
        return updated;
      }
      return co;
    }));
    if (targetOrder) {
      void inventorySocket
        .sendMutation('customer:order_status', { orderId, status }, { queueIfOffline: true })
        .catch(() => {});
    }
    addAuditLog('Customer Order Updated', `Order #${orderId} status set to ${status}`);
  };

  // Customers & Credit Management
  const addCustomer = (customerData: Omit<CustomerProfile, 'id' | 'totalPurchases'>): CustomerProfile => {
    const newCust: CustomerProfile = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalPurchases: 0
    };
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can add CRM customers');
      return newCust;
    }
    setCustomers(prev => [newCust, ...prev]);
    syncManager.syncCustomer(activeStore.id, newCust);
    addAuditLog('Customer Profile Created', `Added ${newCust.name} (${newCust.phone})`);
    return newCust;
  };

  const receiveCreditPayment = (customerId: string, amount: number) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can record Khata credit settlements');
      return;
    }
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const newBal = Math.max(0, c.creditBalance - amount);
        const updatedCust = { ...c, creditBalance: newBal };
        syncManager.syncCustomer(activeStore.id, updatedCust);
        return updatedCust;
      }
      return c;
    }));

    addAuditLog('Credit Payment Received', `Received ₹${amount} credit payment for Customer ID ${customerId}`);
    addNotification({
      title: 'Credit Payment Cleared',
      message: `₹${amount} credit payment recorded. Balance updated.`,
      category: 'payment',
      linkModule: 'retailer'
    });
  };

  const batchAssignInvoiceTemplate = (customerIds: string[], templateId: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    const targetTpl = invoiceTemplates.find(t => t.id === templateId);
    setCustomers(prev => prev.map(c => {
      if (customerIds.includes(c.id)) {
        const updated = {
          ...c,
          assignedTemplateId: templateId,
          segment: targetTpl ? targetTpl.targetSegment : c.segment
        };
        syncManager.syncCustomer(activeStore.id, updated);
        return updated;
      }
      return c;
    }));

    addNotification({
      title: 'Batch Invoice Template Assigned',
      message: `Assigned template "${targetTpl?.name || templateId}" to ${customerIds.length} customer(s).`,
      category: 'system',
      linkModule: 'retailer'
    });

    addAuditLog('Batch Template Assignment', `Assigned template ${targetTpl?.name || templateId} to ${customerIds.length} customers`);
  };

  const updateCustomerSegment = (customerId: string, segment: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const updated = { ...c, segment };
        syncManager.syncCustomer(activeStore.id, updated);
        return updated;
      }
      return c;
    }));
    addAuditLog('Customer Segment Updated', `Updated segment to ${segment} for customer ID ${customerId}`);
  };

  const updateCustomer = (id: string, updates: Partial<CustomerProfile>) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        syncManager.syncCustomer(activeStore.id, updated);
        return updated;
      }
      return c;
    }));
    addAuditLog('Customer Profile Updated', `Updated customer ID ${id}`);
  };

  const deleteCustomer = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setCustomers(prev => prev.filter(c => c.id !== id));
    syncManager.deleteCustomer(activeStore.id, id);
    addAuditLog('Customer Profile Deleted', `Deleted customer ID ${id}`);
  };

  // Employee Management
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can add employees');
      return;
    }
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => [...prev, newEmp]);
    syncManager.syncEmployee(activeStore.id, newEmp);
    addAuditLog('Employee Added', `Added ${newEmp.name} as ${newEmp.role}`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, ...updates };
        syncManager.syncEmployee(activeStore.id, updated);
        return updated;
      }
      return e;
    }));
    addAuditLog('Employee Updated', `Updated staff ID ${id}`);
  };

  const deleteEmployee = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setEmployees(prev => prev.filter(e => e.id !== id));
    syncManager.deleteEmployee(activeStore.id, id);
    addAuditLog('Employee Removed', `Removed employee ID ${id}`, 'warning');
    addNotification({
      title: 'Staff Access Revoked',
      message: `Employee ID ${id} removed from branch roster.`,
      category: 'security',
      linkModule: 'admin'
    });
  };

  const batchUpdateEmployees = (ids: string[], updates: Partial<Employee>, actionDescription?: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setEmployees(prev => prev.map(e => {
      if (ids.includes(e.id)) {
        const updated = { ...e, ...updates };
        syncManager.syncEmployee(activeStore.id, updated);
        return updated;
      }
      return e;
    }));
    const desc = actionDescription || `Updated ${ids.length} staff records`;
    addAuditLog('Batch Staff Update', desc);
    addNotification({
      title: 'Batch Staff Updated',
      message: `${ids.length} staff member accounts were successfully updated.`,
      category: 'security',
      linkModule: 'admin'
    });
  };

  const batchDeleteEmployees = (ids: string[]) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setEmployees(prev => prev.filter(e => !ids.includes(e.id)));
    ids.forEach(id => syncManager.deleteEmployee(activeStore.id, id));
    addAuditLog('Batch Staff Removed', `Removed ${ids.length} employees from roster`, 'warning');
    addNotification({
      title: 'Batch Staff Accounts Removed',
      message: `${ids.length} employee profiles were revoked and removed.`,
      category: 'security',
      linkModule: 'admin'
    });
  };

  // Wholesaler Management (B2B Directory & Onboarding)
  const addWholesaler = (wholesalerData: Omit<Wholesaler, 'id'>): Wholesaler => {
    const newWs: Wholesaler = {
      ...wholesalerData,
      id: `ws-${Date.now()}`
    };
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can add wholesalers');
      return newWs;
    }
    const updated = [...wholesalers, newWs];
    setWholesalers(updated);
    if (!isDemoMode) {
      localStorage.setItem(`ellix_wholesalers_${activeStore.id}`, JSON.stringify(updated));
    }
    syncManager.syncWholesaler(activeStore.id, newWs);
    addAuditLog('Wholesaler Partner Onboarded', `Added B2B Supplier: ${newWs.name} (${newWs.gstin})`);
    addNotification({
      title: 'Wholesale Partner Registered',
      message: `${newWs.name} onboarded to verified distributor hub.`,
      category: 'system',
      linkModule: 'admin'
    });
    return newWs;
  };

  const updateWholesaler = (id: string, updates: Partial<Wholesaler>) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    const updated = wholesalers.map(w => {
      if (w.id === id) {
        const u = { ...w, ...updates };
        syncManager.syncWholesaler(activeStore.id, u);
        return u;
      }
      return w;
    });
    setWholesalers(updated);
    if (!isDemoMode) {
      localStorage.setItem(`ellix_wholesalers_${activeStore.id}`, JSON.stringify(updated));
    }
    addAuditLog('Wholesaler Profile Updated', `Updated supplier ID ${id}`);
  };

  const deleteWholesaler = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    const updated = wholesalers.filter(w => w.id !== id);
    setWholesalers(updated);
    if (!isDemoMode) {
      localStorage.setItem(`ellix_wholesalers_${activeStore.id}`, JSON.stringify(updated));
    }
    syncManager.deleteWholesaler(activeStore.id, id);
    addAuditLog('Wholesaler Agreement Terminated', `Removed supplier partner ID ${id}`, 'warning');
  };

  // Wholesaler Connections
  const toggleConnectionStatus = (connectionId: string, status: RetailerWholesalerConnection['status']) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setConnections(prev => prev.map(conn => {
      if (conn.id === connectionId) {
        return { ...conn, status };
      }
      return conn;
    }));
    addAuditLog('Connection Permission Changed', `Wholesaler Connection ${connectionId} set to ${status}`);
  };

  // Supplier Management (Client/Owner & Admin only for mutations; Crew has read-only access for restock dropdown)
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier => {
    const newSup: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      storeId: supplierData.storeId || activeStore.id,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Crew cannot create suppliers');
      return newSup;
    }
    setSuppliers(prev => [newSup, ...prev]);
    syncManager.syncSupplier(activeStore.id, newSup);
    addAuditLog('Supplier Added', `Added supplier ${newSup.name} for ${activeStore.name}`);
    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Crew cannot update suppliers');
      return;
    }
    setSuppliers(prev => {
      const updatedList = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      const updatedItem = updatedList.find(s => s.id === id);
      if (updatedItem) {
        syncManager.syncSupplier(activeStore.id, updatedItem);
      }
      return updatedList;
    });
    addAuditLog('Supplier Updated', `Updated supplier ID ${id}`);
  };

  const deleteSupplier = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Crew cannot delete suppliers');
      return;
    }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    syncManager.deleteSupplier(activeStore.id, id);
    addAuditLog('Supplier Deleted', `Deleted supplier ID ${id}`, 'warning');
  };

  // Manual Restock Workflow & Logging
  const addRestockLog = (logData: Omit<RestockLog, 'id' | 'date'>) => {
    if (!isDemoMode && authUser && (canonicalRole === 'unauthorized' || canonicalRole === 'customer' || isWholesalerRole || !canUserAccessStore(activeStore))) {
      console.warn('[RBAC] Unauthorized addRestockLog blocked');
      return;
    }
    const addedQty = Number(logData.quantityAdded ?? logData.quantity ?? 0);
    if (!Number.isFinite(addedQty) || addedQty <= 0) {
      console.warn('[RBAC] Restock quantity must be positive');
      return;
    }
    const newLog: RestockLog = {
      ...logData,
      id: `rst-log-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      storeId: activeStore.id,
      crewId: currentUser.id,
      addedById: currentUser.id,
      crewName: currentUser.name,
      addedBy: currentUser.name,
      quantity: addedQty,
      quantityAdded: addedQty
    };
    setRestockLogs(prev => [newLog, ...prev]);
    syncManager.syncRestockLog(activeStore.id, newLog);

    // Update product stock by quantityAdded (skip if caller already updated stock to >= newStock)
    setProducts(prev => prev.map(p => {
      if (p.id === logData.productId) {
        const targetStock = Number.isFinite(Number(logData.newStock))
          ? Math.max(p.stock, Number(logData.newStock))
          : p.stock + addedQty;
        const updated = {
          ...p,
          stock: targetStock,
          supplierId: logData.supplierId || p.supplierId,
          supplierName: logData.supplierName || p.supplierName,
          lastRestockedAt: new Date().toISOString(),
          lastRestockedBy: logData.crewName || logData.addedBy,
          lastRestockedQty: addedQty
        };
        syncManager.syncProduct(activeStore.id, updated);
        return updated;
      }
      return p;
    }));

    void inventorySocket
      .sendMutation(
        'product:restock',
        {
          productId: logData.productId,
          quantityAdded: addedQty,
          log: newLog,
          supplierId: logData.supplierId,
          supplierName: logData.supplierName
        },
        { queueIfOffline: true }
      )
      .catch(() => {});

    addAuditLog(
      'Stock Restocked',
      `Restocked +${logData.quantityAdded || logData.quantity} units of ${logData.productName} by ${logData.addedBy || logData.crewName} (Supplier: ${logData.supplierName || 'Direct'})`
    );

    addNotification({
      title: 'Inventory Restocked',
      message: `${logData.quantityAdded || logData.quantity} units added to ${logData.productName}. New total: ${logData.newStock}.`,
      category: 'restock',
      linkModule: 'retailer'
    });
  };

  // Business Applications Workflow
  const addBusinessApplication = (appData: Omit<BusinessApplication, 'id' | 'appliedAt' | 'status'>): BusinessApplication => {
    const newApp: BusinessApplication = {
      ...appData,
      id: `app-${Date.now()}`,
      appliedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'pending_review',
      assignedAdminId: 'admin-01',
      assignedAdminName: 'Siddharth Admin'
    };
    setBusinessApplications(prev => [newApp, ...prev]);
    addAuditLog('New Client Application', `Application submitted by ${newApp.businessName} (${newApp.ownerName})`);
    addNotification({
      title: 'New Client Application',
      message: `${newApp.businessName} has applied for Ellic partnership. Review required.`,
      category: 'system',
      linkModule: 'admin',
      targetRole: 'ellix_admin'
    });
    return newApp;
  };

  const approveBusinessApplication = async (id: string, notes?: string) => {
    if (!isDemoMode && authUser && !isPlatformAdminRole) {
      console.warn('[RBAC] Forbidden: Only Ellic Admin or Super Admin can approve business applications');
      return;
    }
    const targetApp = businessApplications.find(a => a.id === id);
    if (!targetApp) return;

    // Idempotency: prevent double provisioning
    const existingClientId = targetApp.provisionedClientId;
    const existingStoreId = targetApp.provisionedStoreId;

    const clientId = existingClientId || `client-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || Math.random().toString(36).substring(2, 8)}`;
    const storeId = existingStoreId || `store-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || Math.random().toString(36).substring(2, 8)}`;
    const renewalDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // 1. Provision New Store
    const newStore: Store = {
      id: storeId,
      clientId,
      name: targetApp.businessName,
      ownerName: targetApp.ownerName || 'Business Owner',
      address: targetApp.address || `${targetApp.city || 'Central'}, India`,
      phone: targetApp.phone,
      email: targetApp.email,
      ownerEmail: targetApp.email,
      gstin: targetApp.gstin || '27AAAAA0000A1Z5',
      city: targetApp.city || 'Mumbai',
      ownerUid: targetApp.ownerUid || `user-${clientId}`,
      rating: 5.0,
      reviewCount: 0,
      timings: '9:00 AM - 10:00 PM',
      image: '',
      latitude: 19.0760,
      longitude: 72.8777,
      isOnline: true
    };

    setStores(prev => {
      if (prev.some(s => s.id === storeId)) return prev;
      const updated = [...prev, newStore];
      if (!isDemoMode) {
        localStorage.setItem('ellix_stores', JSON.stringify(updated));
      }
      return updated;
    });

    // 2. Update Application Status
    setBusinessApplications(prev => prev.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status: 'approved',
          provisionedClientId: clientId,
          provisionedStoreId: storeId,
          reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          reviewedBy: currentUser.name,
          notes: notes || app.notes
        };
      }
      return app;
    }));

    // 3. Persist to Firestore if available
    if (isFirestoreAvailable && firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'stores', storeId), {
          id: storeId,
          clientId,
          name: newStore.name,
          address: newStore.address,
          phone: newStore.phone,
          gstin: newStore.gstin,
          city: newStore.city,
          ownerUid: newStore.ownerUid,
          ownerEmail: newStore.ownerEmail,
          createdAt: new Date().toISOString()
        }, { merge: true });

        await setDoc(doc(firestoreDb, 'clients', clientId, 'subscription', 'current'), {
          clientId,
          status: 'active',
          plan: 'growth',
          billingPeriod: 'monthly',
          priceMonthly: 1499,
          currency: 'INR',
          startedAt: new Date().toISOString(),
          renewalDate,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        const initialPayId = `pay-setup-${Date.now()}`;
        await setDoc(doc(firestoreDb, 'clients', clientId, 'subscriptionPayments', initialPayId), {
          id: initialPayId,
          clientId,
          amount: 1499,
          currency: 'INR',
          status: 'paid',
          method: 'admin_provisioned',
          date: new Date().toISOString(),
          referenceNumber: `PROV-${storeId.toUpperCase()}`
        }, { merge: true });

        await setDoc(doc(firestoreDb, 'businessApplications', id), {
          status: 'approved',
          provisionedClientId: clientId,
          provisionedStoreId: storeId,
          reviewedAt: new Date().toISOString(),
          reviewedBy: currentUser.name,
          reviewNotes: notes || 'Approved & Provisioned by Admin'
        }, { merge: true });
      } catch (err) {
        console.warn('[StoreContext] Firestore provisioning warning:', err);
      }
    }

    addAuditLog('Client Application Approved & Provisioned', `Provisioned tenant ${clientId} with store ${newStore.name} (${storeId})`);
    addNotification({
      title: 'Client Approved & Store Provisioned',
      message: `Store ${newStore.name} has been provisioned under Client ID ${clientId}. Active subscription initialized.`,
      category: 'system',
      linkModule: 'admin'
    });
  };

  const rejectBusinessApplication = (id: string, notes?: string) => {
    if (!isDemoMode && authUser && !isPlatformAdminRole) {
      console.warn('[RBAC] Forbidden: Only Ellic Admin or Super Admin can reject business applications');
      return;
    }
    setBusinessApplications(prev => prev.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status: 'rejected',
          reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          reviewedBy: currentUser.name,
          notes: notes || app.notes
        };
      }
      return app;
    }));
    addAuditLog('Client Application Rejected', `Rejected business application ID ${id}`, 'warning');
  };

  // Subscription Billing: Server-Authoritative Gateway Integration & Secure Purge
  const renewSubscription = async (): Promise<void> => {
    const clientId = activeStore.clientId || 'client-001';
    const storeId = activeStore.id;

    let token = '';
    if (authUser) {
      try {
        token = await authUser.getIdToken();
      } catch (e) {
        console.warn('Could not retrieve user ID token:', e);
      }
    }

    const response = await fetch('/api/subscription/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        clientId,
        storeId,
        planId: subscription.name || 'growth',
        billingCycle: 'monthly'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to initiate checkout with payment gateway');
    }

    if (data.liveGatewayActive && data.orderId) {
      // Razorpay live checkout flow
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency || 'INR',
            name: 'Ellic Retail OS',
            description: `Subscription Renewal - ${activeStore.name}`,
            order_id: data.orderId,
            handler: async function (razorpayResponse: any) {
              try {
                const verifyRes = await fetch('/api/subscription/verify-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({
                    razorpay_order_id: razorpayResponse.razorpay_order_id,
                    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                    razorpay_signature: razorpayResponse.razorpay_signature,
                    clientId
                  })
                });
                const verifyData = await verifyRes.json();
                if (!verifyRes.ok) {
                  throw new Error(verifyData.error || 'Payment signature verification failed');
                }
                addNotification({
                  title: 'Subscription Renewed',
                  message: `Payment ${razorpayResponse.razorpay_payment_id} verified. Access extended until ${verifyData.renewalDate}.`,
                  category: 'payment',
                  targetRole: 'client'
                });
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: function () {
                reject(new Error('Checkout window closed without completing payment.'));
              }
            },
            prefill: {
              name: currentUser.name,
              email: currentUser.email,
              contact: currentUser.phone || ''
            },
            theme: {
              color: '#10B981'
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        script.onerror = () => reject(new Error('Failed to load Razorpay payment SDK'));
        document.body.appendChild(script);
      });
    } else {
      // Explicitly reject self-asserted renewal when gateway is not active
      const notActiveMsg = 'LIVE PAYMENT GATEWAY: NOT ACTIVE — CREDENTIALS NOT CONFIGURED';
      addNotification({
        title: 'Payment Gateway Inactive',
        message: `${notActiveMsg}. Browser cannot self-declare payment renewal.`,
        category: 'payment',
        targetRole: 'client'
      });
      throw new Error(notActiveMsg);
    }
  };

  const paySubscriptionBill = () => {
    renewSubscription().catch(err => {
      console.warn('Subscription payment bill notice:', err.message);
    });
  };

  const cancelSubscriptionAndDeleteData = async (confirmationStoreName: string): Promise<boolean> => {
    if (confirmationStoreName.trim().toLowerCase() !== activeStore.name.trim().toLowerCase() && confirmationStoreName.trim() !== 'DELETE') {
      return false;
    }

    const clientId = activeStore.clientId || 'client-001';
    const storeId = activeStore.id;

    let token = '';
    if (authUser) {
      try {
        token = await authUser.getIdToken();
      } catch (e) {
        console.warn('Could not retrieve user ID token:', e);
      }
    }

    // Call trusted server-side tenant purge endpoint
    try {
      const response = await fetch('/api/admin/tenant/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          clientId,
          confirmName: confirmationStoreName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server tenant purge failed:', errorData);
        return false;
      }
    } catch (err) {
      console.error('Error connecting to tenant purge API:', err);
      return false;
    }

    // Only clear client state AFTER verified server purge
    const remainingStores = stores.filter(s => s.id !== storeId);
    setStores(remainingStores.length > 0 ? remainingStores : mockStores);
    if (remainingStores.length > 0) {
      setActiveStore(remainingStores[0]);
    }
    setProducts([]);
    setInvoices([]);
    setCustomers([]);
    setRestockLogs([]);
    setRestockOrders([]);
    setSubscription(prev => ({ ...prev, status: 'cancelled' }));

    localStorage.removeItem(`ellix_products_${storeId}`);
    localStorage.removeItem(`ellix_invoices_${storeId}`);
    localStorage.removeItem(`ellix_customers_${storeId}`);
    localStorage.removeItem(`ellix_suppliers_${storeId}`);
    localStorage.removeItem(`ellix_restock_orders_${storeId}`);
    localStorage.removeItem(`ellix_restock_logs_${storeId}`);
    localStorage.removeItem(`ellix_employees_${storeId}`);
    localStorage.removeItem(`ellix_audit_logs_${storeId}`);
    localStorage.removeItem(`ellix_wholesalers_${storeId}`);

    addAuditLog('Subscription Cancelled & Tenant Purged', `Server purged tenant store collections and marked subscription cancelled for ${activeStore.name}`, 'warning');
    return true;
  };

  // Store Management (Franchise & Multi-Outlet)
  const addStore = (storeData: Omit<Store, 'id' | 'rating' | 'reviewCount'>) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can provision stores');
      return;
    }
    const newStore: Store = {
      ...storeData,
      id: `store-${Date.now()}`,
      clientId: isPlatformAdminRole ? (storeData.clientId || currentUser.clientId || 'client-001') : (currentUser.clientId || 'client-001'),
      ownerUid: isPlatformAdminRole ? (storeData.ownerUid || currentUser.id) : currentUser.id,
      rating: 4.8,
      reviewCount: 0
    };
    const updated = [...stores, newStore];
    setStores(updated);
    if (!isDemoMode) {
      localStorage.setItem('ellix_stores', JSON.stringify(updated));
    }
    syncManager.syncStore(newStore);
    addAuditLog('Store Outlet Provisioned', `Added new branch: ${newStore.name} (${newStore.city})`);
    addNotification({
      title: 'New Store Branch Registered',
      message: `Successfully provisioned ${newStore.name} under enterprise tenant license.`,
      category: 'system',
      linkModule: 'admin'
    });
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can update store details');
      return;
    }
    const updated = stores.map(st => {
      if (st.id === id) {
        const safeUpdates = isPlatformAdminRole
          ? updates
          : { ...updates, clientId: st.clientId, ownerUid: st.ownerUid };
        const u = { ...st, ...safeUpdates };
        syncManager.syncStore(u);
        return u;
      }
      return st;
    });
    setStores(updated);
    if (!isDemoMode) {
      localStorage.setItem('ellix_stores', JSON.stringify(updated));
    }
    if (activeStore.id === id) {
      setActiveStore(prev => ({ ...prev, ...updates }));
    }
    addAuditLog('Store Outlet Updated', `Updated branch details for ID ${id}`);
  };

  const deleteStore = (id: string) => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Only Client/Admin can delete stores');
      return;
    }
    if (stores.length <= 1) return;
    const updated = stores.filter(st => st.id !== id);
    setStores(updated);
    if (!isDemoMode) {
      localStorage.setItem('ellix_stores', JSON.stringify(updated));
    }
    if (activeStore.id === id) {
      setActiveStore(updated[0]);
    }
    addAuditLog('Store Outlet Removed', `Decommissioned outlet ID ${id}`);
  };

  // Toggle store pause status for unpaid subscriptions
  const toggleStorePause = async (storeId: string, isPaused: boolean, reason?: string) => {
    if (!isDemoMode && authUser && !isPlatformAdminRole) {
      console.warn('[RBAC] Forbidden: Only Admin/Super Admin can pause or resume stores');
      return;
    }
    const targetStore = stores.find(s => s.id === storeId);
    const storeName = targetStore?.name || storeId;

    const updated = stores.map(st => {
      if (st.id === storeId) {
        const u: Store = {
          ...st,
          status: isPaused ? 'paused' : 'active',
          subscriptionStatus: isPaused ? 'unpaid' : 'paid',
          pausedReason: isPaused ? (reason || 'Subscription payment required') : undefined,
          pausedAt: isPaused ? new Date().toISOString() : undefined,
          pausedBy: isPaused ? (userProfile?.email || 'Admin') : undefined
        };
        syncManager.syncStore(u);
        return u;
      }
      return st;
    });

    setStores(updated);
    if (!isDemoMode) {
      localStorage.setItem('ellix_stores', JSON.stringify(updated));
    }
    if (activeStore.id === storeId) {
      setActiveStore(prev => ({
        ...prev,
        status: isPaused ? 'paused' : 'active',
        subscriptionStatus: isPaused ? 'unpaid' : 'paid',
        pausedReason: isPaused ? (reason || 'Subscription payment required') : undefined
      }));
    }

    addAuditLog(
      isPaused ? 'Store Subscription Paused' : 'Store Subscription Activated',
      `${isPaused ? 'Paused' : 'Activated'} store "${storeName}". Status: ${isPaused ? 'Unpaid / Paused' : 'Paid / Active'}.`
    );

    try {
      let token = '';
      if (authUser) token = await authUser.getIdToken();
      await fetch('/api/admin/stores/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ storeId, isPaused, reason })
      });
    } catch {
      // offline fallback succeeded
    }
  };

  // Change user role (promote/demote customer, client, crew, etc.)
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!isDemoMode && authUser && !isPlatformAdminRole) {
      console.warn('[RBAC] Forbidden: Only Admin/Super Admin can change user roles');
      return;
    }
    const target = employees.find(e => e.id === userId);
    const userName = target?.name || userId;

    setEmployees(prev =>
      prev.map(emp => (emp.id === userId ? { ...emp, role: newRole } : emp))
    );

    addAuditLog(
      'User Role Updated',
      `Changed role for ${userName} (${target?.email || userId}) to ${newRole.toUpperCase()}`
    );

    try {
      let token = '';
      if (authUser) token = await authUser.getIdToken();
      await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ uid: userId, newRole })
      });
    } catch {
      // offline fallback
    }
  };

  // Subscription Plan Updates
  const updateSubscription = (updates: Partial<SubscriptionPlan>) => {
    if (!isDemoMode && authUser && !isPlatformAdminRole) {
      console.warn('[RBAC] Forbidden: Client/Crew cannot locally override subscription state');
      return;
    }
    setSubscription(prev => {
      const next = { ...prev, ...updates };
      if (!isDemoMode) {
        localStorage.setItem(`ellix_subscription_${activeClientId}`, JSON.stringify(next));
      }
      return next;
    });
    addAuditLog('SaaS Subscription Modified', `Plan updated to ${updates.name || subscription.name}`);
    addNotification({
      title: 'Subscription Tier Updated',
      message: `Platform license updated to ${updates.name || subscription.name}.`,
      category: 'system',
      linkModule: 'admin'
    });
  };

  const clearAuditLogs = () => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) return;
    setAuditLogs([]);
    if (!isDemoMode) {
      localStorage.removeItem(`ellix_audit_logs_${activeStore.id}`);
    }
    addNotification({
      title: 'Audit Logs Archived',
      message: 'System audit logs cleared and archived.',
      category: 'system',
      linkModule: 'admin'
    });
  };

  const resetToDefaultData = () => {
    if (!isDemoMode && authUser && !isAuthorizedOwnerOrAdmin) {
      console.warn('[RBAC] Forbidden: Crew cannot reset store data');
      return;
    }
    if (isDemoMode) {
      const defaultStoreId = mockStores[0].id;
      const defaultProducts = loadStoreScopedCache('ellix_products', defaultStoreId, mockProducts);
      const defaultRestockOrders = loadStoreScopedCache('ellix_restock_orders', defaultStoreId, mockRestockOrders);
      const defaultCustomerOrders = loadStoreScopedCache('ellix_customer_orders', defaultStoreId, mockCustomerOrders);
      setStores(mockStores);
      setActiveStore(mockStores[0]);
      setProducts(defaultProducts);
      setWholesalers(loadStoreScopedCache('ellix_wholesalers', defaultStoreId, mockWholesalers));
      setWholesalerProducts(mockWholesalerProducts);
      setConnections(mockConnections);
      setCustomers(loadStoreScopedCache('ellix_customers', defaultStoreId, mockCustomers));
      setInvoices(loadStoreScopedCache('ellix_invoices', defaultStoreId, mockInvoices));
      setRestockOrders(defaultRestockOrders);
      setCustomerOrders(defaultCustomerOrders);
      setEmployees(loadStoreScopedCache('ellix_employees', defaultStoreId, mockEmployees));
      setSuppliers(loadStoreScopedCache('ellix_suppliers', defaultStoreId, mockSuppliers));
      setRestockLogs(loadStoreScopedCache('ellix_restock_logs', defaultStoreId, mockRestockLogs));
      setNotifications(mockNotifications);
      setAuditLogs(loadStoreScopedCache('ellix_audit_logs', defaultStoreId, mockAuditLogs));
      setInvoiceTemplates(mockInvoiceTemplates);
      void inventorySocket
        .sendMutation('room:reset', {
          initialState: {
            products: defaultProducts,
            wholesalerProducts: mockWholesalerProducts,
            restockOrders: defaultRestockOrders,
            customerOrders: defaultCustomerOrders
          }
        })
        .catch(() => {});
      return;
    }

    localStorage.removeItem(`ellix_products_${activeStore.id}`);
    localStorage.removeItem(`ellix_wholesalers_${activeStore.id}`);
    localStorage.removeItem(`ellix_connections_${activeStore.id}`);
    localStorage.removeItem(`ellix_customers_${activeStore.id}`);
    localStorage.removeItem(`ellix_invoices_${activeStore.id}`);
    localStorage.removeItem(`ellix_restock_orders_${activeStore.id}`);
    localStorage.removeItem(`ellix_customer_orders_${activeStore.id}`);
    localStorage.removeItem(`ellix_employees_${activeStore.id}`);
    localStorage.removeItem(`ellix_suppliers_${activeStore.id}`);
    localStorage.removeItem(`ellix_restock_logs_${activeStore.id}`);
    localStorage.removeItem(`ellix_notifications_${activeStore.id}`);
    localStorage.removeItem(`ellix_audit_logs_${activeStore.id}`);
    setProducts([]);
    setWholesalers([]);
    setConnections([]);
    setCustomers([]);
    setInvoices([]);
    setRestockOrders([]);
    setCustomerOrders([]);
    setEmployees([]);
    setSuppliers([]);
    setRestockLogs([]);
    setNotifications([]);
    setAuditLogs([]);
    setInvoiceTemplates(mockInvoiceTemplates);
  };

  const restoreDatabaseFromJSON = (snapshot: any): { success: boolean; message: string } => {
    if (!isDemoMode && authUser && !isPlatformAdminRole) {
      return { success: false, message: 'Forbidden: Only platform administrators can restore database snapshots.' };
    }
    try {
      if (!snapshot || typeof snapshot !== 'object') {
        return { success: false, message: 'Invalid JSON snapshot payload' };
      }

      const targetStoreId = (Array.isArray(snapshot.stores) && snapshot.stores[0]?.id) || activeStore.id;

      if (Array.isArray(snapshot.stores) && snapshot.stores.length > 0) {
        setStores(snapshot.stores);
        setActiveStore(snapshot.stores[0]);
        localStorage.setItem('ellix_stores', JSON.stringify(snapshot.stores));
      }
      if (Array.isArray(snapshot.products)) {
        setProducts(snapshot.products);
        localStorage.setItem(`ellix_products_${targetStoreId}`, JSON.stringify(snapshot.products));
      }
      if (Array.isArray(snapshot.wholesalers)) {
        setWholesalers(snapshot.wholesalers);
        localStorage.setItem(`ellix_wholesalers_${targetStoreId}`, JSON.stringify(snapshot.wholesalers));
      }
      if (Array.isArray(snapshot.customers)) {
        setCustomers(snapshot.customers);
        localStorage.setItem(`ellix_customers_${targetStoreId}`, JSON.stringify(snapshot.customers));
      }
      if (Array.isArray(snapshot.invoices)) {
        setInvoices(snapshot.invoices);
        localStorage.setItem(`ellix_invoices_${targetStoreId}`, JSON.stringify(snapshot.invoices));
      }
      if (Array.isArray(snapshot.restockOrders)) {
        setRestockOrders(snapshot.restockOrders);
        localStorage.setItem(`ellix_restock_orders_${targetStoreId}`, JSON.stringify(snapshot.restockOrders));
      }
      if (Array.isArray(snapshot.employees)) {
        setEmployees(snapshot.employees);
        localStorage.setItem(`ellix_employees_${targetStoreId}`, JSON.stringify(snapshot.employees));
      }
      if (Array.isArray(snapshot.invoiceTemplates)) {
        setInvoiceTemplates(snapshot.invoiceTemplates);
        localStorage.setItem(`ellix_invoice_templates_${targetStoreId}`, JSON.stringify(snapshot.invoiceTemplates));
      }
      if (Array.isArray(snapshot.auditLogs)) {
        setAuditLogs(snapshot.auditLogs);
        localStorage.setItem(`ellix_audit_logs_${targetStoreId}`, JSON.stringify(snapshot.auditLogs));
      }

      addAuditLog('Database Restored', 'Restored database snapshot from imported JSON file', 'success');
      addNotification({
        title: 'Database Restored Successfully',
        message: 'System records updated from JSON backup snapshot.',
        category: 'system',
        linkModule: 'admin'
      });

      return { success: true, message: 'Database successfully restored from JSON backup.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to restore database from snapshot' };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        isDemoMode,
        activeModule,
        setActiveModule: handleSetActiveModule,
        activeRole,
        setActiveRole,
        currentUser,
        activeStore,
        setActiveStore: handleSetActiveStore,
        stores: accessibleStores,
        products,
        suppliers,
        restockLogs,
        businessApplications,
        wholesalers,
        wholesalerProducts,
        connections,
        customers,
        invoices,
        restockOrders,
        customerOrders,
        employees,
        notifications,
        auditLogs,
        subscription,
        invoiceTemplates,
        unreadCount,
        theme,
        setTheme,
        toggleTheme,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isNotificationModalOpen,
        setIsNotificationModalOpen,
        cloudSyncState,
        saveFeedback,
        wsStatus,
        wsPresence,
        forceCloudSync,
        isDataLoading,
        setIsDataLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductSharing,
        updateWholesalerProductStock,
        createInvoice,
        deleteInvoice,
        addInvoiceTemplate,
        updateInvoiceTemplate,
        deleteInvoiceTemplate,
        setDefaultInvoiceTemplate,
        sendRestockRequest,
        updateRestockOrder,
        acceptQuotationAndGeneratePO,
        createCustomerOrder,
        updateCustomerOrderStatus,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        receiveCreditPayment,
        batchAssignInvoiceTemplate,
        updateCustomerSegment,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        batchUpdateEmployees,
        batchDeleteEmployees,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addRestockLog,
        addBusinessApplication,
        approveBusinessApplication,
        rejectBusinessApplication,
        cancelSubscriptionAndDeleteData,
        paySubscriptionBill,
        addWholesaler,
        updateWholesaler,
        deleteWholesaler,
        addStore,
        updateStore,
        deleteStore,
        toggleStorePause,
        updateUserRole,
        visitorStats,
        refreshVisitorStats,
        updateSubscription,
        clearAuditLogs,
        toggleConnectionStatus,
        markNotificationRead,
        clearAllNotifications,
        addAuditLog,
        resetToDefaultData,
        restoreDatabaseFromJSON
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
};
