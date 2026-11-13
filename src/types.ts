export type ActiveModule = 'retailer' | 'wholesaler' | 'customer' | 'admin';

// 4-Level Authority Hierarchy as defined by Ellix Connect specifications:
// Level 1: super_admin (Owner / Creator of Ellix Connect)
// Level 2: ellix_admin (Assigned operator / manager of Ellix Connect)
// Level 3: client (Business / Store Owner)
// Level 4: crew (In-store staff member / cashier)
// B2B: wholesaler_admin
// Fail-closed: unauthorized
export type AppRole = 'super_admin' | 'ellix_admin' | 'client' | 'customer' | 'crew';

export type CanonicalRole =
  | 'super_admin'
  | 'ellix_admin'
  | 'client'
  | 'customer'
  | 'crew'
  | 'wholesaler_admin'
  | 'unauthorized';

export type UserRole =
  | 'super_admin'
  | 'ellix_admin'
  | 'client'
  | 'customer'
  | 'crew'
  | 'wholesaler_admin'
  | 'unauthorized'
  // Legacy aliases for backward compatibility
  | 'admin'
  | 'platform_admin'
  | 'owner'
  | 'retailer'
  | 'employee'
  | 'cashier'
  | 'staff'
  | 'wholesaler'
  | 'manager'
  | 'inventory_staff';

/**
 * Canonical role normalization used identically across Frontend, Backend, and Firestore Rules.
 * Unrecognized roles fail closed to 'unauthorized' and NEVER silently become 'client'.
 */
export function normalizeCanonicalRole(rawRole: unknown): CanonicalRole {
  if (typeof rawRole !== 'string') return 'unauthorized';
  const normalized = rawRole.trim().toLowerCase();
  switch (normalized) {
    case 'super_admin':
      return 'super_admin';
    case 'ellix_admin':
    case 'admin':
    case 'platform_admin':
      return 'ellix_admin';
    case 'client':
    case 'owner':
    case 'retailer':
      return 'client';
    case 'customer':
    case 'shopper':
    case 'buyer':
      return 'customer';
    case 'crew':
    case 'employee':
    case 'cashier':
    case 'staff':
      return 'crew';
    case 'wholesaler_admin':
    case 'wholesaler':
      return 'wholesaler_admin';
    default:
      return 'unauthorized';
  }
}

export function isUserStatusInactive(data: { status?: string; disabled?: boolean; active?: boolean; isActive?: boolean } | null | undefined): boolean {
  if (!data) return false;
  if (data.disabled === true || data.active === false || data.isActive === false) {
    return true;
  }
  if (typeof data.status === 'string') {
    const st = data.status.trim().toLowerCase();
    if (['inactive', 'suspended', 'revoked', 'disabled', 'deactivated', 'deleted'].includes(st)) {
      return true;
    }
  }
  return false;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  storeId?: string;
  clientId?: string;
  assignedStoreIds?: string[];
  wholesalerId?: string;
  avatar?: string;
  permissions: string[];
  emailVerified?: boolean;
  phoneVerified?: boolean;
  linkedProviders?: string[];
  passwordSynchronized?: boolean;
  isRealAuth?: boolean;
  firebaseUid?: string;
  status?: 'active' | 'pending_approval' | 'suspended' | 'inactive' | 'revoked' | 'disabled';
  totpEnrolled?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorType?: 'totp' | 'sms' | 'none';
}

export interface Store {
  id: string;
  clientId?: string;
  ownerUid?: string;
  ownerEmail?: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  gstin: string;
  rating: number;
  reviewCount: number;
  timings: string;
  image: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  status?: 'active' | 'paused' | 'unpaid' | 'pending';
  subscriptionStatus?: 'paid' | 'unpaid' | 'expired' | 'trial';
  subscriptionPlan?: string;
  pausedReason?: string;
  pausedAt?: string;
  pausedBy?: string;
}

export interface Supplier {
  id: string;
  storeId?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  categories?: string[];
  rating?: number;
  paymentTerms?: string;
  notes?: string;
  createdAt?: string;
}

export interface RestockLog {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  quantityAdded: number;
  previousStock: number;
  newStock: number;
  date: string;
  addedBy: string; // Crew member name
  addedById: string; // Crew member ID
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  crewId?: string;
  crewName?: string;
  quantity?: number;
  createdAt?: string;
}

export interface BusinessApplication {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  gstin?: string;
  appliedAt: string;
  status: 'pending_review' | 'approved' | 'rejected';
  assignedAdminId?: string;
  assignedAdminName?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  selectedPlanId?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string; // e.g., 'pcs', 'kg', 'ltr', 'pack', 'box'
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  stock: number;
  minThreshold: number;
  barcode: string;
  qrCode: string;
  expiryDate?: string;
  batchNumber?: string;
  warehouseLocation?: string;
  sharedWithWholesalers: boolean;
  image?: string;
  description?: string;
  taxRate: number; // percentage, e.g. 18, 12, 5
  storeId: string;
  supplierId?: string;
  supplierName?: string;
}

export interface SupplierPerformanceMetrics {
  avgLeadTimeDays: number;
  fulfillmentSuccessRate: number; // e.g. 98.4%
  onTimeDispatchRate: number; // e.g. 96.8%
  accuracyRate: number; // e.g. 99.2%
  totalOrdersFulfilled: number;
  qualityRating: number;
  tierStatus: 'Platinum' | 'Gold' | 'Silver' | 'Standard';
  leadTimeCategoryBreakdown?: { category: string; avgLeadTimeDays: number; fulfillmentRate: number }[];
}

export interface Wholesaler {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  rating: number;
  categories: string[];
  minimumOrderValue: number;
  minOrderValue?: number;
  performance?: SupplierPerformanceMetrics;
  city?: string;
  category?: string;
  deliveryDays?: number;
  isVerified?: boolean;
}

export interface WholesalerProduct {
  id: string;
  wholesalerId: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  wholesalePrice: number;
  mrp: number;
  stockAvailable: number;
  moq: number; // minimum order quantity
  tierPrices?: { minQty: number; price: number }[];
  image?: string;
}

export type RetailerWholesalerStatus = 'pending' | 'connected' | 'rejected' | 'revoked';

export interface RetailerWholesalerConnection {
  id: string;
  retailerStoreId: string;
  retailerName: string;
  wholesalerId: string;
  wholesalerName: string;
  status: RetailerWholesalerStatus;
  sharedProductIds: string[];
  connectedSince?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercentage: number;
  discountFlat: number;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'credit' | 'split';

export interface SplitPaymentDetails {
  cashAmount: number;
  cardAmount: number;
  upiAmount: number;
  bankAmount?: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditBalance: number;
  loyaltyPoints: number;
  phoneVerified: boolean;
  totalPurchases: number;
  savedAddresses?: string[];
  segment?: 'VIP / Corporate' | 'Wholesale Buyers' | 'Regular Retail' | 'B2B Clients' | string;
  assignedTemplateId?: string;
}

export interface POSInvoice {
  id: string;
  invoiceNumber: string;
  storeId: string;
  clientId?: string;
  storeName: string;
  storeGSTIN: string;
  storeAddress: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerWhatsApp?: string;
  sentViaWhatsApp?: boolean;
  createdBy?: string;
  createdById?: string;
  cashierName?: string;
  cashierId?: string;
  date: string;
  isGSTInvoice: boolean;
  templateId?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  }[];
  subtotal: number;
  discountTotal: number;
  discountAmount?: number;
  discountPercent?: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'paid' | 'pending' | 'partially_paid';
  splitDetails?: SplitPaymentDetails;
  referenceNumber?: string;
  upiTxnRef?: string;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
}

export interface ClientSubscriptionRecord {
  clientId: string;
  status: 'active' | 'past_due' | 'grace_period' | 'blocked' | 'cancelled';
  plan: string;
  billingPeriod: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  startedAt: string;
  renewalDate: string;
  gracePeriodEndsAt?: string;
  cancelledAt?: string;
  updatedAt: string;
}

export interface SubscriptionPaymentRecord {
  id: string;
  clientId: string;
  amount: number;
  currency: string;
  date: string;
  status: 'paid' | 'failed' | 'refunded';
  method: string;
  periodStart: string;
  periodEnd: string;
  referenceNumber: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
  decimals: number;
  defaultTaxRate?: number;
  taxLabel?: string;
}

export interface InternationalTradeSettings {
  primaryCurrency: string;
  enableDualCurrency: boolean;
  secondaryCurrency?: string;
  fxSpreadPercentage?: number;
  showExchangeRateOnBill: boolean;
  showSwiftIban: boolean;
  swiftCode?: string;
  ibanNumber?: string;
  bankName?: string;
  beneficiaryName?: string;
  incoterms?: 'EXW' | 'FOB' | 'CIF' | 'CIP' | 'DAP' | 'DDP' | string;
  portOfLoadingOrDischarge?: string;
  countryOfOrigin?: string;
  customsTariffHSN?: string;
  vatTaxRegistrationNumber?: string;
}

export interface InvoiceTemplateBranding {
  logoUrl?: string;
  storeDisplayName?: string;
  headerTagline?: string;
  primaryColor: string;
  accentColor: string;
  footerNote: string;
  termsAndConditions: string;
}

export interface InvoiceTemplateVariableFields {
  showGSTIN: boolean;
  showCustomerPhone: boolean;
  showLoyaltyPoints: boolean;
  showUPIRef: boolean;
  showBarcodeQR: boolean;
  showItemTaxBreakdown: boolean;
  showItemDiscount: boolean;
  showPaymentSplitDetails: boolean;
  showInternationalTradeDetails?: boolean;
  showDualCurrencySummary?: boolean;
  customHeaderFieldLabel?: string;
  customHeaderFieldValue?: string;
}

export interface InvoiceTemplateColumnSettings {
  showSNo: boolean;
  showItemName: boolean;
  showItemDesc?: boolean;
  showHSN: boolean;
  showBatchNo?: boolean;
  showExpDate?: boolean;
  showMfgDate?: boolean;
  showQuantity: boolean;
  showMRP?: boolean;
  showUnitPrice: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showAmount: boolean;
}

export interface InvoiceTemplateAdditionalInfo {
  challanNo?: string;
  poNo?: string;
  ewayBillNo?: string;
  vehicleNo?: string;
  dueDate?: string;
  panNo?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  accountHolder?: string;
  upiId?: string;
  showUPIQR?: boolean;
  showBankDetails?: boolean;
  showTerms?: boolean;
  showSignatureBlock?: boolean;
  showSavingsHighlight?: boolean;
  showAmountInWords?: boolean;
  showDecorativeBorder?: boolean;
  documentType?: 'TAX INVOICE' | 'BILL OF SUPPLY' | 'EXPORT INVOICE' | 'RETAIL BILL' | string;
  recipientType?: 'ORIGINAL FOR RECIPIENT' | 'DUPLICATE FOR TRANSPORTER' | 'TRIPLICATE FOR SUPPLIER' | string;
  previousBalance?: number;
  receivedAmount?: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  targetSegment: 'VIP / Corporate' | 'Wholesale Buyers' | 'Regular Retail' | 'B2B Clients' | 'All Segments';
  paperSize: 'a4' | 'thermal' | 'a5' | 'a5_landscape' | 'thermal_2inch' | 'thermal_3inch';
  templateStyle?: 'a4_luxury_gold' | 'a4_modern_custom' | 'a5_compact_box' | 'a5_hardware_transport' | 'thermal_2inch' | 'thermal_3inch' | 'standard';
  isDefault: boolean;
  branding: InvoiceTemplateBranding;
  variableFields: InvoiceTemplateVariableFields;
  columnSettings?: InvoiceTemplateColumnSettings;
  additionalInfo?: InvoiceTemplateAdditionalInfo;
  internationalSettings?: InternationalTradeSettings;
  createdAt: string;
}

export type RestockStatus = 'suggested' | 'quotation_sent' | 'po_created' | 'dispatched' | 'delivered' | 'rejected';

export interface RestockOrder {
  id: string;
  retailerStoreId: string;
  retailerName: string;
  wholesalerId: string;
  wholesalerName: string;
  productId: string;
  productName: string;
  suggestedQty: number;
  quotedQty?: number;
  quotedUnitPrice?: number;
  totalQuotedAmount?: number;
  status: RestockStatus;
  createdAt: string;
  deliveryDate?: string;
  trackingNumber?: string;
  notes?: string;
  stockAppliedOnDelivery?: boolean;
}

export type CustomerOrderStatus = 'placed' | 'confirmed' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  orderType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    image?: string;
  }[];
  totalAmount: number;
  paymentStatus: 'paid_online' | 'pay_at_store' | 'cod';
  paymentMethod?: string;
  orderStatus: CustomerOrderStatus;
  createdAt: string;
  pickupQrCode: string;
  stockReserved?: boolean;
}

export interface Employee {
  id: string;
  storeId: string;
  clientId?: string;
  assignedStoreIds?: string[];
  name: string;
  role: 'crew' | 'client' | 'customer' | 'owner' | 'manager' | 'inventory_staff' | 'cashier' | 'ellix_admin' | 'super_admin' | string;
  email: string;
  phone: string;
  permissions: {
    canApplyDiscount?: boolean;
    inventoryEdit: boolean;
    reports: boolean;
    employeeManagement: boolean;
    restockOrders: boolean;
  };
  status: 'active' | 'inactive';
  pin?: string;
  shift?: string;
  active?: boolean;
  totalSalesHandled?: number;
  twoFactorEnabled?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'low_stock' | 'restock' | 'customer_order' | 'payment' | 'security' | 'system';
  timestamp: string;
  read: boolean;
  linkModule?: ActiveModule;
  targetRole?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'error';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier?: 'starter' | 'growth' | 'enterprise' | string;
  priceMonthly: number;
  priceYearly: number;
  modulesIncluded: string[];
  activeStoresCount: number;
  maxStores?: number;
  maxProducts?: number;
  status: 'active' | 'grace_period' | 'blocked' | 'cancelled' | 'trial' | 'expired';
  renewalDate: string;
  gracePeriodEndsAt?: string;
  gracePeriodDays?: number;
  monthlyCharge?: number;
}

export interface SaveFeedback {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message: string;
  timestamp: number;
}

export interface CloudSyncState {
  status: 'synced' | 'syncing' | 'offline' | 'error' | 'pending';
  lastSyncedAt: string | null;
  pendingCount: number;
  lastError: string | null;
  databaseId: string;
  syncedCounts: {
    products: number;
    customers: number;
    invoices: number;
    restockOrders: number;
    customerOrders: number;
    wholesalers?: number;
    employees?: number;
  };
}

export interface OfflineSyncItem {
  id: string;
  collection: 'products' | 'customers' | 'invoices' | 'restockOrders' | 'customerOrders' | 'auditLogs' | 'wholesalers' | 'employees' | 'stores';
  action: 'create' | 'update' | 'delete';
  docId: string;
  data?: any;
  timestamp: string;
}

export interface DailyTrendItem {
  date: string;
  visitors: number;
  pageViews: number;
  conversions: number;
}

export interface PlatformTelemetryStats {
  activeVisitors: number;
  totalVisitors: number;
  todayVisitors: number;
  dailyTrends: DailyTrendItem[];
  clientCount: number;
  customerCount: number;
  onlineStores: number;
  pausedStores: number;
  totalReviews: number;
  averageRating: number;
}

export type WebSocketSyncStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type WebSocketParty = 'retailer' | 'wholesaler' | 'customer' | 'admin';

export interface WebSocketRoomPresence {
  retailer: number;
  wholesaler: number;
  customer: number;
  admin: number;
  total: number;
}
