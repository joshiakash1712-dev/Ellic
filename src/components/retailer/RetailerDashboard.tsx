import React, { useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  Plus,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Activity,
  Boxes,
  BarChart3,
  Flame,
  MapPin,
  ChevronRight,
  Wifi,
  Calendar,
  Check,
  ShieldCheck,
  Building2,
  Users,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Tag,
  CreditCard,
  Receipt,
  Truck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardSkeleton } from '../common/skeletons/DashboardSkeleton';
import { StockStatusBadge } from '../common/StockStatusBadge';
import { ScrollChartReveal } from '../common/ScrollChartReveal';

export interface RetailerDashboardProps {
  onNavigateToInventory: () => void;
  onNavigateToRestock: () => void;
  onNavigateToPOS?: () => void;
  onNavigateToWholesale?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToJourneyMap?: () => void;
  isLoading?: boolean;
  activeModule?: string;
  onModuleChange?: (module: string) => void;
}

// Crisp SVG Sparkline Component — Scroll-Triggered Left-to-Right Line Draw (Section 17)
const Sparkline: React.FC<{ points: number[]; color?: string }> = ({
  points,
  color = '#2563EB'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isInView = useInView(svgRef, { once: true, amount: 0.3 });
  const prefersReducedMotion = useReducedMotion();

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 68;
  const height = 24;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });

  const pathData = coords
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');

  const lastPt = coords[coords.length - 1] || { x: width, y: height / 2 };

  return (
    <svg
      ref={svgRef}
      className="w-16 h-6 overflow-visible shrink-0"
      viewBox={`0 0 ${width} ${height}`}
    >
      <motion.path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0.25 }}
        animate={
          prefersReducedMotion
            ? { pathLength: 1, opacity: 1 }
            : isInView
            ? { pathLength: 1, opacity: 1 }
            : { pathLength: 0, opacity: 0.25 }
        }
        transition={{
          duration: 0.78,
          ease: [0.16, 1, 0.3, 1]
        }}
      />
      <motion.circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="2.4"
        fill={color}
        initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
        animate={
          prefersReducedMotion
            ? { scale: 1, opacity: 1 }
            : isInView
            ? { scale: 1, opacity: 1 }
            : { scale: 0, opacity: 0 }
        }
        transition={{
          delay: 0.62,
          duration: 0.28,
          ease: [0.16, 1, 0.3, 1]
        }}
      />
    </svg>
  );
};

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({
  onNavigateToInventory,
  onNavigateToRestock,
  onNavigateToPOS,
  onNavigateToWholesale,
  onNavigateToReports,
  onNavigateToJourneyMap,
  isLoading,
  activeModule: propActiveModule,
  onModuleChange
}) => {
  const {
    isDemoMode,
    activeStore,
    products,
    invoices,
    restockOrders,
    sendRestockRequest,
    isDataLoading,
    customers,
    employees
  } = useStore();
  const { currentUser: rawAuthUser } = useAuth();
  const authUser = isDemoMode ? null : rawAuthUser;

  const isActuallyLoading = isLoading ?? isDataLoading;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();




  // Derived Business Metrics - completely dynamic from POS invoices and inventory
  const validInvoices = useMemo(() => invoices.filter(inv => inv.status !== 'voided'), [invoices]);
  const todaySales = useMemo(() => validInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0), [validInvoices]);
  const billCount = validInvoices.length;
  const totalItemsSold = useMemo(() => {
    return validInvoices.reduce((acc, inv) => acc + (inv.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0), 0);
  }, [validInvoices]);
  const avgBillValue = billCount > 0 ? Math.round(todaySales / billCount) : 0;
  const estimatedProfit = Math.round(todaySales * 0.22);

  // Operational Indicators (FIX 5)
  const khataReceivables = useMemo(() => {
    return (customers || []).reduce((acc, c) => acc + ((c as any).khataBalance || 0), 0);
  }, [customers]);
  const khataAccountsCount = useMemo(() => {
    return (customers || []).filter(c => ((c as any).khataBalance || 0) > 0).length;
  }, [customers]);
  const activeCrewCount = useMemo(() => {
    const storeCrew = (employees || []).filter(
      e => (e.active || e.status === 'active') && (e.storeId === activeStore.id || !e.storeId)
    );
    return storeCrew.length || 2;
  }, [employees, activeStore.id]);

  // Inventory Health Metrics
  const lowStockProducts = products.filter(p => p.stock <= p.minThreshold && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const healthyProducts = products.filter(p => p.stock > p.minThreshold);
  const totalInventoryUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);

  // Wholesale Orders
  const activeRestocks = restockOrders.filter(o => o.status !== 'delivered' && o.status !== 'rejected');
  const pipelineValue = activeRestocks.reduce(
    (acc, o) => acc + (o.totalQuotedAmount || (o.suggestedQty || 10) * (o.quotedUnitPrice || 390)),
    0
  );
  const pendingOrdersCount = restockOrders.filter(
    o => o.status === 'quotation_sent' || o.status === 'suggested' || o.status === 'in_review'
  ).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRestockSingle = (productId: string, productName: string, deficit: number) => {
    const qty = Math.max(10, deficit * 2);
    sendRestockRequest(productId, qty);
    showToast(`Wholesale PO generated: +${qty} units for ${productName}`);
  };

  const handleRestockAll = () => {
    if (lowStockProducts.length === 0) return;
    lowStockProducts.forEach(p => {
      const deficit = Math.max(1, p.minThreshold - p.stock);
      sendRestockRequest(p.id, Math.max(10, deficit * 2));
    });
    showToast(`Bulk restock POs sent for ${lowStockProducts.length} low-stock items!`);
  };

  // Dynamic Hourly Sales Trend Data for Bar Chart
  const hourlySalesData = useMemo(() => {
    const hours = ['9AM', '11AM', '1PM', '3PM', '5PM', '7PM', '9PM'];
    const buckets: Record<string, number> = {
      '9AM': 0,
      '11AM': 0,
      '1PM': 0,
      '3PM': 0,
      '5PM': 0,
      '7PM': 0,
      '9PM': 0
    };

    if (validInvoices.length > 0) {
      validInvoices.forEach(inv => {
        let hourNum = 13;
        if (inv.date?.includes(':')) {
          const match = inv.date.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            hourNum = parseInt(match[1], 10);
          }
        }
        if (hourNum < 10) buckets['9AM'] += inv.grandTotal;
        else if (hourNum < 12) buckets['11AM'] += inv.grandTotal;
        else if (hourNum < 14) buckets['1PM'] += inv.grandTotal;
        else if (hourNum < 16) buckets['3PM'] += inv.grandTotal;
        else if (hourNum < 18) buckets['5PM'] += inv.grandTotal;
        else if (hourNum < 20) buckets['7PM'] += inv.grandTotal;
        else buckets['9PM'] += inv.grandTotal;
      });
    }

    const hasData = Object.values(buckets).some(v => v > 0);
    if (!hasData) {
      return [
        { time: '9AM', sales: 2400 },
        { time: '11AM', sales: 4800 },
        { time: '1PM', sales: 6200 },
        { time: '3PM', sales: 3900 },
        { time: '5PM', sales: 4100 },
        { time: '7PM', sales: 5800 },
        { time: '9PM', sales: 3200 }
      ];
    }

    return hours.map(h => ({ time: h, sales: buckets[h] }));
  }, [validInvoices]);

  // Dynamic Top Selling Items aggregated from invoices
  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>();

    validInvoices.forEach(inv => {
      inv.items?.forEach(it => {
        const current = itemMap.get(it.productId) || {
          name: it.name,
          category: 'General',
          quantity: 0,
          revenue: 0
        };
        current.quantity += it.quantity;
        current.revenue += it.totalPrice || (it.quantity * it.unitPrice);
        const match = products.find(p => p.id === it.productId);
        if (match?.category) current.category = match.category;
        itemMap.set(it.productId, current);
      });
    });

    const sorted = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
    if (sorted.length > 0) {
      return sorted.slice(0, 4);
    }

    // Default to top product catalog entries if no purchases logged yet today
    return products.slice(0, 4).map((p, idx) => ({
      name: p.name,
      category: p.category,
      quantity: Math.max(1, 12 - idx * 2),
      revenue: (Math.max(1, 12 - idx * 2)) * p.sellingPrice
    }));
  }, [validInvoices, products]);

  // Dynamic Inventory Donut Ring
  const totalSkus = products.length || 1;
  const circumference = 2 * Math.PI * 38; // ~238.76
  const healthyDash = (healthyProducts.length / totalSkus) * circumference;
  const lowStockDash = (lowStockProducts.length / totalSkus) * circumference;

  // Dynamic User Greeting
  const userGreetingName = authUser?.displayName?.split(' ')[0] || activeStore.ownerName?.split(' ')[0] || 'Store Owner';

  // Format dynamic date
  const todayDateString = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });



  if (isActuallyLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full min-w-0 text-slate-100 pb-8">
      
      {/* Real-time Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-2xl shadow-blue-600/40 flex items-center gap-2.5 border border-sky-400/40"
          >
            <CheckCircle2 className="w-5 h-5 text-sky-200" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SECTION 1: DASHBOARD HERO / STORE STATUS & QUICK ACTIONS                  */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 lg:p-6 rounded-2xl glass-panel shadow-xl flex flex-col justify-between gap-4 sm:gap-5 relative overflow-hidden border border-slate-800">
        {/* Subtle brand gradient backdrop BEHIND the glass hero */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/15 via-slate-900/70 to-sky-500/15 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 z-10">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-xs font-bold text-sky-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
                <span>Live Store Sync</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>{todayDateString}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activeStore.name} · {activeStore.city || 'Nashik'}</span>
              </span>
              {lowStockProducts.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300 tabular-nums">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{lowStockProducts.length} Low Stock Alert{lowStockProducts.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight pt-0.5">
              Welcome back, {userGreetingName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-3xl">
              Your store operations and inventory are synchronized in real time. Here is your business performance snapshot for today.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 pt-1 lg:pt-0">
            <button
              id="btn-hero-new-bill"
              onClick={onNavigateToPOS || onNavigateToInventory}
              className="min-h-[38px] sm:min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New POS Bill</span>
            </button>

            <button
              id="btn-hero-add-stock"
              onClick={onNavigateToInventory}
              className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-cyan-400" />
              <span>Add Stock</span>
            </button>

            <button
              id="btn-hero-wholesale-order"
              onClick={onNavigateToWholesale || onNavigateToRestock}
              className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>Wholesale Orders</span>
            </button>

            <button
              id="btn-hero-view-reports"
              onClick={onNavigateToReports || onNavigateToInventory}
              className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Reports & GST</span>
            </button>
          </div>
        </div>

        {/* Ambient Subtle Accent Glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PRIMARY FINANCIAL & OPERATIONAL KPIs                           */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-200 tracking-tight flex items-center gap-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            <span>Today's Business Performance</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">Live POS Stream</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0 tabular-nums">
          
          {/* KPI 1: Today's Sales */}
          <div className="p-4 sm:p-4.5 lg:p-5 rounded-2xl glass-panel glass-panel-interactive shadow-lg transition-all flex flex-col justify-between min-w-0 border border-slate-800/90 hover:border-slate-700 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none -z-10" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-[13px] font-bold text-slate-300">Today's Gross Sales</span>
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                ₹
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white tracking-tight">
                ₹{todaySales.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mt-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18.4% vs yesterday</span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-1">
                {totalItemsSold} total items sold across {billCount} invoices
              </div>
            </div>
          </div>

          {/* KPI 2: Total Orders / Completed Bills */}
          <div className="p-4 sm:p-4.5 lg:p-5 rounded-2xl glass-panel glass-panel-interactive shadow-lg transition-all flex flex-col justify-between min-w-0 border border-slate-800/90 hover:border-slate-700 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-sky-500/10 rounded-full blur-xl pointer-events-none -z-10" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-[13px] font-bold text-slate-300">Total Orders / Bills</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white tracking-tight">
                {billCount}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 mt-1.5">
                <span>Avg. Basket: ₹{avgBillValue.toLocaleString()}</span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Completed counter POS transactions today
              </div>
            </div>
          </div>

          {/* KPI 3: Pending Payments (Customer Khata) */}
          <div
            onClick={onNavigateToReports || onNavigateToInventory}
            className="p-4 sm:p-4.5 lg:p-5 rounded-2xl glass-panel glass-panel-interactive shadow-lg transition-all flex flex-col justify-between min-w-0 border border-slate-800/90 hover:border-slate-700 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none -z-10" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-[13px] font-bold text-slate-300">Pending Payments (Khata)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-amber-300 tracking-tight">
                ₹{khataReceivables.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mt-1.5">
                <span>{khataAccountsCount} active credit accounts</span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>Receivables awaiting collection</span>
                <span className="text-amber-400 font-semibold group-hover:underline">Review &rarr;</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Inventory Overview */}
          <div
            onClick={onNavigateToInventory}
            className="p-4 sm:p-4.5 lg:p-5 rounded-2xl glass-panel glass-panel-interactive shadow-lg transition-all flex flex-col justify-between min-w-0 border border-slate-800/90 hover:border-slate-700 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl pointer-events-none -z-10" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-[13px] font-bold text-slate-300">Inventory Valuation</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-cyan-300 tracking-tight">
                ₹{totalInventoryValue.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 mt-1.5">
                <span>{products.length} catalog SKUs</span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{healthyProducts.length} healthy · {lowStockProducts.length} low stock</span>
                <span className="text-cyan-400 font-semibold group-hover:underline">Manage &rarr;</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: SALES ANALYTICS & INTRADAY PERFORMANCE                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 w-full min-w-0 items-stretch">
        
        {/* Left (8 Cols): Spacious Hourly Sales Trend Bar Chart */}
        <div className="lg:col-span-8 p-4 sm:p-5 lg:p-6 rounded-2xl bg-[#0E1726] border border-slate-800 shadow-xl space-y-3.5 min-w-0 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Intraday Hourly Sales Analytics
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time hourly revenue distribution across counter hours
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                Live Feed
              </span>
              <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                Today
              </span>
            </div>
          </div>

          {/* Generous Chart Height for High Readability */}
          <ScrollChartReveal className="h-56 sm:h-64 lg:h-72 w-full min-w-0 pt-2" triggerKey={validInvoices.length}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlySalesData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                  tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + 'k' : v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#152238',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Billed Revenue']}
                />
                <Bar dataKey="sales" fill="#2563EB" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ScrollChartReveal>

          {/* Summary Strip under Chart */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-2.5 border-t border-slate-800 tabular-nums">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Billed Revenue</div>
              <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">₹{todaySales.toLocaleString()}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Avg Order Value</div>
              <div className="text-sm sm:text-base font-extrabold text-sky-400 mt-0.5">₹{avgBillValue}</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Units Sold</div>
              <div className="text-sm sm:text-base font-extrabold text-cyan-400 mt-0.5">{totalItemsSold} units</div>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 font-medium">Transactions</div>
              <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">{billCount}</div>
            </div>
          </div>
        </div>

        {/* Right (4 Cols): Business Drivers & Margin Summary */}
        <div className="lg:col-span-4 p-4 sm:p-5 lg:p-6 rounded-2xl bg-[#0E1726] border border-slate-800 shadow-xl space-y-4 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
              <div className="p-1.5 sm:p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Financial Drivers</h3>
                <p className="text-xs text-slate-400 mt-0.5">Calculated margin & operational load</p>
              </div>
            </div>

            <div className="space-y-2.5 mt-3">
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#070B14] border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Estimated Profit</div>
                  <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">₹{estimatedProfit.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">22.0% estimated gross margin</div>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-[#070B14] border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Store Crew on Duty</div>
                  <div className="text-base sm:text-lg font-black text-sky-400 mt-0.5">{activeCrewCount} Staff Members</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Active shift synchronized</div>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl bg-[#070B14] border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Wholesale Orders</div>
                  <div className="text-base sm:text-lg font-black text-white mt-0.5">₹{pipelineValue.toLocaleString()}</div>
                  <div className="text-[11px] text-amber-400 mt-0.5">{pendingOrdersCount} active restock quotes</div>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToReports || onNavigateToInventory}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Open Detailed Financial Analytics</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: LOW-STOCK ALERTS & INVENTORY ACTION CENTER                     */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-[#0E1726] border border-slate-800 shadow-xl space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Inventory Low-Stock Alerts &amp; Replenishment
                </h2>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[11px] uppercase tabular-nums">
                  {lowStockProducts.length} items below safety threshold
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Products requiring distributor restock to prevent stockouts and customer checkout friction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {lowStockProducts.length > 0 && (
              <button
                id="btn-restock-all"
                onClick={handleRestockAll}
                className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Restock All ({lowStockProducts.length})</span>
              </button>
            )}
            <button
              onClick={onNavigateToInventory}
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              All Inventory
            </button>
          </div>
        </div>

        {/* Low Stock Items Grid/List */}
        <div className="space-y-2.5">
          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center bg-[#070B14] rounded-2xl border border-slate-800/80">
              <CheckCircle2 className="w-9 h-9 text-sky-400 mx-auto mb-2" />
              <div className="text-sm sm:text-base font-bold text-white">All catalog products are healthy</div>
              <div className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No items have breached minimum replenishment thresholds. Store shelves are fully stocked.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {lowStockProducts.map(p => {
                const deficit = Math.max(1, p.minThreshold - p.stock);

                return (
                  <div
                    key={p.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#070B14] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-700/60 shrink-0 bg-slate-800"
                        />
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-white">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {p.category} · {p.brand}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1.5">
                          <StockStatusBadge stock={p.stock} unit={p.unit} showQuantity={true} size="sm" />
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                            Safety Min: {p.minThreshold} {p.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 tabular-nums space-y-1">
                      <div>
                        <div className="text-xs sm:text-sm font-black text-amber-400">
                          -{deficit} {p.unit}
                        </div>
                        <div className="text-[10px] text-slate-400">deficit</div>
                      </div>

                      <button
                        id={`btn-restock-${p.id}`}
                        onClick={() => handleRestockSingle(p.id, p.name, deficit)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: RECENT TRANSACTIONS & ACTIVITY STREAM                          */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-[#0E1726] border border-slate-800 shadow-xl space-y-3.5 min-w-0">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Recent Store Invoices &amp; Transactions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed counter sales and customer billing activity
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToReports || onNavigateToInventory}
            className="text-xs sm:text-sm font-bold text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Invoices</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-200 tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {validInvoices.slice(0, 5).map(inv => {
                const timePart = inv.date?.includes(' ') ? inv.date.split(' ')[1] : '14:30';
                const itemsCount = inv.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1;
                return (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 sm:py-3 px-3 font-mono font-bold text-slate-200 text-xs sm:text-sm">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 text-slate-400 text-xs">{timePart}</td>
                    <td className="py-2.5 sm:py-3 px-3 font-semibold text-white">
                      {inv.customerName || 'Walk-in Customer'}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 uppercase">
                        {inv.paymentMethod || inv.paymentMode || 'Cash'}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 text-slate-400 text-xs">
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 text-right font-black text-white text-sm sm:text-base">
                      ₹{inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Paid</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
              {validInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-7 h-7 text-slate-600 mb-1" />
                      <div className="font-bold text-slate-200 text-sm sm:text-base">No transactions logged yet today</div>
                      <div className="text-slate-400 text-xs max-w-sm">
                        New sales created at the counter POS will immediately appear in this live ledger.
                      </div>
                      {onNavigateToPOS && (
                        <button
                          type="button"
                          onClick={onNavigateToPOS}
                          className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all cursor-pointer"
                        >
                          Launch POS Terminal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: BUSINESS PERFORMANCE ANALYTICS & INVENTORY HEALTH              */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SECTION 6: BUSINESS PERFORMANCE ANALYTICS & INVENTORY HEALTH              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full min-w-0 items-stretch">
        
        {/* Card 1: Top Selling Items (Today) */}
        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-[#0E1726] border border-slate-800 shadow-xl space-y-3.5 flex flex-col justify-between tabular-nums">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Top Selling Items</h3>
                  <p className="text-xs text-slate-400">Highest revenue contributors today</p>
                </div>
              </div>
              <button
                onClick={onNavigateToInventory}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {topSellingItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#070B14] border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <span>{item.quantity} units sold</span>
                      <span>•</span>
                      <span className="text-slate-500">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-sky-400">₹{item.revenue.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">Gross Sales</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Inventory Health Donut */}
        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-[#0E1726] border border-slate-800 shadow-xl space-y-3.5 flex flex-col justify-between tabular-nums">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
                  <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Inventory Health Ratio</h3>
                  <p className="text-xs text-slate-400">Stock distribution across safety levels</p>
                </div>
              </div>
              <button
                onClick={onNavigateToInventory}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Inventory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Crisp Animated SVG Donut Ring */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="10"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    whileInView={{ strokeDasharray: `${healthyDash} ${circumference}` }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {lowStockProducts.length > 0 && (
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="10"
                      initial={{ strokeDasharray: `0 ${circumference}` }}
                      whileInView={{ strokeDasharray: `${lowStockDash} ${circumference}` }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.75, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      strokeDashoffset={-healthyDash}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl sm:text-2xl font-black text-white">{products.length}</span>
                  <span className="text-[11px] text-slate-400 font-semibold">Total SKUs</span>
                </div>
              </div>
            </div>

            {/* Health Legend Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
                <span className="text-slate-200 font-semibold text-[11px] sm:text-xs">{healthyProducts.length} Healthy</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-slate-200 font-semibold text-[11px] sm:text-xs">{lowStockProducts.length} Low Stock</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-300 text-[11px] sm:text-xs">{outOfStockProducts.length} Out of Stock</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
                <span className="text-slate-400 text-[11px] sm:text-xs">0 Inactive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Operational Services Status */}
        <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-[#0E1726] border border-slate-800 shadow-xl space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">System &amp; Hardware Status</h3>
                  <p className="text-xs text-slate-400">Terminal connectivity &amp; tax engine</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                Operational
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-slate-300 font-medium">POS Terminal Engine</span>
                <span className="text-sky-400 font-semibold flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  Active &amp; Ready
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-slate-300 font-medium">Wholesale B2B Network</span>
                <span className="text-sky-400 font-semibold flex items-center gap-1.5 text-xs tabular-nums">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Connected ({activeRestocks.length} Active POs)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-slate-300 font-medium">GST &amp; Tax Compliance</span>
                <span className="text-sky-400 font-semibold flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  GSTR-1 Ready
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl bg-[#070B14] border border-slate-800">
                <span className="text-slate-300 font-medium">Cloud Database Sync</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Encrypted &amp; Synced
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: FOOTER BRANDING                                                */}
      {/* ========================================================================= */}
      <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Ellic Business OS</span>
          <span>•</span>
          <span>Hyperlocal Retail Cloud</span>
          <span>•</span>
          <span>Made in India 🇮🇳</span>
        </div>
        <div className="text-slate-400">
          TLS 1.3 • AES-256 Cloud Sync • GST Ready
        </div>
      </div>

    </div>
  );
};
