import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveModule, normalizeCanonicalRole } from '../../types';
import { EllixConnectLogo } from '../branding/EllixConnectLogo';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  BarChart3,
  ShieldCheck,
  Building2,
  Sliders,
  Zap,
  Palette,
  Menu,
  X,
  Store as StoreIcon,
  Truck,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  Wifi,
  WifiOff,
  CheckCircle2,
  Sparkles,
  Settings,
  Moon,
  Sun,
  Database,
  Lock,
  Activity,
  Compass,
  LogIn,
  LogOut,
  Smartphone,
  Mail,
  KeyRound,
  Globe,
  Bot,
  LifeBuoy,
  ShoppingBag
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  onOpenMobileDrawer?: () => void;
  onNavigateToWebsite?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  badge?: string;
  count?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer = () => {},
  onOpenMobileDrawer = () => {},
  onNavigateToWebsite
}) => {
  const {
    isDemoMode,
    activeModule,
    setActiveModule,
    activeStore,
    setActiveStore,
    stores,
    activeRole,
    currentUser: storeUser,
    products,
    suppliers,
    employees,
    businessApplications,
    theme,
    toggleTheme,
    setIsSettingsModalOpen
  } = useStore();

  const {
    currentUser: rawAuthUser,
    userProfile: rawUserProfile,
    openAuthModal,
    setIsSyncHubOpen
  } = useAuth();

  const authUser = isDemoMode ? null : rawAuthUser;
  const userProfile = isDemoMode ? null : rawUserProfile;

  const [showStorePickerInDrawer, setShowStorePickerInDrawer] = React.useState(false);

  const canonicalRole = normalizeCanonicalRole(activeRole);
  const isCrew = canonicalRole === 'crew';
  const isSuperAdmin =
    authUser?.email?.toLowerCase() === 'ellixorrr@gmail.com' ||
    authUser?.email?.toLowerCase() === 'joshiakash1712@gmail.com' ||
    authUser?.email?.toLowerCase() === 'superadmin@ellic.com' ||
    canonicalRole === 'super_admin' ||
    normalizeCanonicalRole(userProfile?.role) === 'super_admin';
  const isPlatformAdmin = isSuperAdmin || canonicalRole === 'ellix_admin' || normalizeCanonicalRole(userProfile?.role) === 'ellix_admin';
  const isWholesaler = canonicalRole === 'wholesaler_admin';

  const allowedStores = isCrew
    ? stores.filter(s => (storeUser?.assignedStoreIds || [activeStore.id]).includes(s.id))
    : stores;

  const lowStockCount = products.filter(p => p.stock <= p.minThreshold).length;

  const retailerItems: NavItem[] = isCrew ? [
    { id: 'pos', label: 'POS Billing', shortLabel: 'POS', icon: <Receipt className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory & Stock', shortLabel: 'Stock', icon: <Package className="w-5 h-5" />, count: products.length },
    { id: 'my_sales', label: 'My Sales', shortLabel: 'My Sales', icon: <Receipt className="w-5 h-5" /> }
  ] : [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'pos', label: 'POS Billing', shortLabel: 'POS', icon: <Receipt className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory & Stock', shortLabel: 'Stock', icon: <Package className="w-5 h-5" />, count: products.length },
    { id: 'crm', label: 'Customers & Khata', shortLabel: 'Customers', icon: <Users className="w-5 h-5" /> },
    { id: 'suppliers', label: 'Store Suppliers', shortLabel: 'Suppliers', icon: <Truck className="w-5 h-5" />, count: suppliers.length },
    { id: 'reports', label: 'Reports & GST', shortLabel: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'templates', label: 'Invoice Templates', shortLabel: 'Templates', icon: <Palette className="w-5 h-5" /> },
    { id: 'employees', label: 'Store Crew & Roles', shortLabel: 'Crew', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'journey_map', label: 'Customer Journey Map', shortLabel: 'Journey', icon: <Compass className="w-5 h-5" />, badge: 'UX' }
  ];

  const wholesalerItems: NavItem[] = [
    { id: 'wholesaler_portal', label: 'Orders & Quotes', shortLabel: 'Orders', icon: <Zap className="w-5 h-5" /> },
    { id: 'wholesaler_catalog', label: 'Bulk Catalog', shortLabel: 'Catalog', icon: <Package className="w-5 h-5" /> },
    { id: 'wholesaler_retailers', label: 'Connected Retailers', shortLabel: 'Retailers', icon: <Building2 className="w-5 h-5" /> }
  ];

  const pendingAppsCount = businessApplications?.filter(a => a.status === 'pending').length || 0;

  const adminItems: NavItem[] = [
    { id: 'admin_overview', label: 'Platform Console', shortLabel: 'Console', icon: <Sliders className="w-5 h-5" /> },
    {
      id: 'admin_clients',
      label: 'Clients & Subscriptions',
      shortLabel: 'Clients',
      icon: <Building2 className="w-5 h-5" />,
      badge: pendingAppsCount > 0 ? `${pendingAppsCount} Pending` : undefined
    },
    { id: 'admin_stores', label: 'Stores & Franchises', shortLabel: 'Stores', icon: <StoreIcon className="w-5 h-5" />, count: stores.length },
    {
      id: 'admin_users',
      label: isSuperAdmin ? 'Crew & RBAC Governance' : 'Client & User Access',
      shortLabel: 'Users & RBAC',
      icon: <Users className="w-5 h-5" />,
      count: employees.length
    },
    { id: 'admin_wholesalers', label: 'Wholesale B2B Hub', shortLabel: 'Wholesale', icon: <Truck className="w-5 h-5" /> },
    ...(isSuperAdmin ? [
      { id: 'admin_database', label: 'Database & Sync', shortLabel: 'Database', icon: <Database className="w-5 h-5" /> },
      { id: 'admin_security', label: 'Security & 2FA Governance', shortLabel: 'Security', icon: <Lock className="w-5 h-5" /> }
    ] : []),
    { id: 'admin_audit', label: 'Compliance Audit Trail', shortLabel: 'Audit', icon: <Activity className="w-5 h-5" /> },
    { id: 'journey_map', label: 'Customer Journey Map', shortLabel: 'Journey', icon: <Compass className="w-5 h-5" />, badge: 'UX' }
  ];

  const customerItems: NavItem[] = [
    { id: 'customer_catalog', label: 'Product Catalog', shortLabel: 'Catalog', icon: <ShoppingBag className="w-5 h-5" />, count: products.length },
    { id: 'customer_stores', label: 'Nearby Stores', shortLabel: 'Stores', icon: <StoreIcon className="w-5 h-5" />, count: stores.length },
    { id: 'customer_orders', label: 'My Orders & QR', shortLabel: 'Orders', icon: <Receipt className="w-5 h-5" /> },
    { id: 'journey_map', label: 'Customer Journey Map', shortLabel: 'Journey', icon: <Compass className="w-5 h-5" />, badge: 'UX' }
  ];

  const items =
    activeModule === 'retailer'
      ? retailerItems
      : activeModule === 'wholesaler'
      ? wholesalerItems
      : activeModule === 'customer'
      ? customerItems
      : adminItems;

  // Primary mobile bottom navigation items
  const primaryBottomNavItems = items.slice(0, 4);

  const isEllixAdmin = canonicalRole === 'ellix_admin';
  const isCustomer = canonicalRole === 'customer';

  const modulesList: { id: ActiveModule; label: string; icon: React.ReactNode }[] = [
    ...(!isWholesaler && !isEllixAdmin && !isCustomer ? [{ id: 'retailer' as ActiveModule, label: 'Store', icon: <StoreIcon className="w-3.5 h-3.5" /> }] : []),
    ...(!isCrew && !isEllixAdmin && !isCustomer ? [{ id: 'wholesaler' as ActiveModule, label: 'Wholesale', icon: <Truck className="w-3.5 h-3.5" /> }] : []),
    ...((isDemoMode || isPlatformAdmin || isCustomer) ? [{ id: 'customer' as ActiveModule, label: 'Customer', icon: <ShoppingBag className="w-3.5 h-3.5" /> }] : []),
    ...((isDemoMode || isPlatformAdmin) ? [{ id: 'admin' as ActiveModule, label: 'Admin', icon: <ShieldAlert className="w-3.5 h-3.5" /> }] : [])
  ];

  // Close mobile drawer on Escape key
  React.useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobileDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, onCloseMobileDrawer]);

  // Arrow key navigation between sidebar items & leap to main workstage
  const handleNavKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    itemList: NavItem[]
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % itemList.length;
      const nextEl = document.getElementById(`nav-desktop-${itemList[nextIndex].id}`);
      nextEl?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + itemList.length) % itemList.length;
      const prevEl = document.getElementById(`nav-desktop-${itemList[prevIndex].id}`);
      prevEl?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      const firstEl = document.getElementById(`nav-desktop-${itemList[0].id}`);
      firstEl?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastEl = document.getElementById(`nav-desktop-${itemList[itemList.length - 1].id}`);
      lastEl?.focus();
    } else if (e.key === 'ArrowRight') {
      // Leap into main workstage
      e.preventDefault();
      const workstage = document.getElementById('main-workstage');
      if (workstage) {
        const primary = workstage.querySelector<HTMLElement>(
          'input[type="text"]:not([disabled]), input[type="search"]:not([disabled]), button:not([disabled])'
        );
        if (primary) {
          primary.focus();
        } else {
          workstage.focus();
        }
      }
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. DESKTOP SIDEBAR (md:flex)                                  */}
      {/* ------------------------------------------------------------- */}
      <aside
        id="sidebar-nav"
        tabIndex={-1}
        role="navigation"
        aria-label="Sidebar Navigation"
        className="hidden md:flex w-[240px] shrink-0 h-[100dvh] max-h-[100dvh] glass-panel border-r border-slate-800 text-slate-300 p-2.5 flex-col min-h-0 relative overflow-hidden outline-none select-none z-30"
      >
        {/* Subtle brand gradient backdrop BEHIND the glass sidebar */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-600/10 via-sky-500/5 to-transparent pointer-events-none" />
        
        {/* ============================================================= */}
        {/* REGION 1: BRANDING & STORE SELECTOR (Fixed Header, shrink-0)   */}
        {/* ============================================================= */}
        <div className="shrink-0 flex flex-col space-y-1.5 pb-2 border-b border-slate-800/80">
          {/* Ellic Brand Wordmark Header */}
          <div className="flex items-center justify-between shrink-0">
            {onNavigateToWebsite ? (
              <button
                type="button"
                onClick={onNavigateToWebsite}
                className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                title={isDemoMode ? 'Exit Demo to Website' : 'Return to Website'}
              >
                <EllixConnectLogo size="sm" alt="Ellic" />
              </button>
            ) : (
              <EllixConnectLogo size="sm" alt="Ellic" />
            )}
            {isDemoMode && (
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Demo
              </span>
            )}
          </div>

          {/* Active Store / Executive Admin Profile Pill */}
          {activeModule === 'admin' ? (
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-[#161D2C] border border-sky-500/30 shadow-sm shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {isSuperAdmin ? 'Superadmin Hub' : 'Platform Operations'}
                </div>
                <div className="text-[10px] text-sky-400 font-semibold truncate flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                  <span>Root Governance · {stores.length} Outlets</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#161D2C] border border-slate-800 shadow-sm shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                {activeStore.name?.slice(0, 2).toUpperCase() || 'EM'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{activeStore.name || 'Main Store'}</div>
                <div className="text-[10px] text-sky-400 font-semibold truncate flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                  <span>{isCrew ? 'Assigned Store' : 'Active Store'} · {activeStore.city || 'India'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Primary Workspace Switcher (Desktop Sidebar) */}
          {modulesList.length > 1 && (
            <div
              className="grid gap-1 p-0.5 rounded-lg bg-[#0A0E1A] border border-slate-800 shrink-0"
              style={{ gridTemplateColumns: `repeat(${Math.min(modulesList.length, 4)}, minmax(0, 1fr))` }}
            >
              {modulesList.map(mod => {
                const isActive = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={`min-h-[30px] flex items-center justify-center gap-1 py-1 px-1 rounded-md text-[10px] font-bold transition-all truncate ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {mod.icon}
                    <span className="truncate">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================= */}
        {/* REGION 2: INDEPENDENTLY SCROLLABLE NAVIGATION (flex-1 min-h-0) */}
        {/* ============================================================= */}
        <nav
          aria-label={`${activeModule} navigation links`}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1.5 space-y-0.5 pr-1 focus:outline-none [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.3)_transparent] hover:[scrollbar-color:rgba(148,163,184,0.5)_transparent]"
        >
          <div className="px-2 py-0.5 text-[10px] lg:text-[11px] uppercase font-bold tracking-wider text-slate-400 sticky top-0 bg-[#0E1726]/95 backdrop-blur-sm z-10">
            {activeModule.toUpperCase()} NAVIGATION
          </div>

          {items.map((item, index) => {
            const isActive =
              activeView === item.id ||
              (item.id === 'admin_overview' && (activeView === 'admin_dashboard' || activeView === 'overview' || activeView === 'admin_overview')) ||
              (item.id === `admin_${activeView}`);
            return (
              <button
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => onSelectView(item.id)}
                onKeyDown={(e) => handleNavKeyDown(e, index, items)}
                aria-current={isActive ? 'page' : undefined}
                aria-selected={isActive}
                className={`w-full min-h-[34px] flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md shadow-blue-500/20 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-sky-400/20 text-sky-300 border border-sky-400/30 shrink-0">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ============================================================= */}
        {/* REGION 3: BOTTOM-PINNED UTILITY PANELS (shrink-0, border-t)   */}
        {/* ============================================================= */}
        <div className="shrink-0 pt-2 border-t border-slate-800/80 space-y-1.5 max-h-[38vh] overflow-y-auto [scrollbar-width:none]">
          {activeModule === 'retailer' && (
            <button
              id="btn-sidebar-actions-required"
              onClick={() => onSelectView('inventory')}
              className="w-full min-h-[38px] p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 hover:border-amber-500/50 text-left transition-all group flex items-center justify-between"
              title="View items requiring replenishment"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-amber-300 truncate">
                    {lowStockCount > 0 ? `${lowStockCount} Actions Required` : 'Inventory Healthy'}
                  </div>
                  <div className="text-[9px] text-amber-200/80 truncate">
                    {lowStockCount > 0 ? `${lowStockCount} items below threshold` : 'All stocks optimal'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400/60 group-hover:text-amber-300 shrink-0" />
            </button>
          )}

          {/* Auth & Sync Hub Quick Card */}
          <div>
            {authUser ? (
              <button
                id="btn-sidebar-sync-hub"
                onClick={() => setIsSyncHubOpen(true)}
                className="w-full min-h-[38px] p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/50 text-left transition-all group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Identity
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-400 group-hover:underline">
                    Security &rarr;
                  </span>
                </div>
                <div className="text-xs font-semibold text-white truncate mt-0.5">
                  {authUser.displayName || 'Merchant Partner'}
                </div>
                <div className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                  <span>{authUser.email || authUser.phoneNumber}</span>
                </div>
              </button>
            ) : isDemoMode ? (
              <div className="p-2 rounded-xl bg-[#161D2C] border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                    App Demo Mode
                  </span>
                  <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">
                    Sample Data
                  </span>
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {storeUser?.name || 'Vikram Malhotra'}
                </div>
                {onNavigateToWebsite && (
                  <button
                    id="btn-sidebar-exit-demo"
                    onClick={onNavigateToWebsite}
                    className="w-full min-h-[34px] py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/20"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Exit Demo</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                id="btn-sidebar-sign-in"
                onClick={() => openAuthModal('login')}
                className="w-full min-h-[36px] py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Marketing Website Return Button */}
          {onNavigateToWebsite && !isDemoMode && (
            <div>
              <button
                id="btn-sidebar-website"
                onClick={onNavigateToWebsite}
                className="w-full min-h-[34px] flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all"
                title="Return to Marketing Website"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Marketing Website</span>
                </div>
                <span className="text-[10px] text-slate-400">View &rarr;</span>
              </button>
            </div>
          )}

          {/* Settings Menu Button */}
          <div>
            <button
              id="btn-sidebar-settings"
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-full min-h-[34px] flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700/80 transition-all active:scale-[0.98]"
              title="Open System Settings & Theme"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span>System Settings</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. ANDROID MATERIAL 3 COLLAPSIBLE NAVIGATION DRAWER (MOBILE)  */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="fixed inset-0 z-50 md:hidden flex"
          >
            
            {/* Scrim / Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobileDrawer}
              className="fixed inset-0 bg-slate-950/80"
              aria-hidden="true"
            />

            {/* Navigation Drawer Surface with Touch Swipe-to-Dismiss */}
            <motion.div
              id="android-navigation-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              drag="x"
              dragConstraints={{ left: -310, right: 0 }}
              dragElastic={{ left: 0.15, right: 0 }}
              dragSnapToOrigin={false}
              onDragEnd={(_event, info) => {
                // If swiped left by 60px or with negative velocity, dismiss drawer
                if (info.offset.x < -60 || info.velocity.x < -200) {
                  onCloseMobileDrawer();
                }
              }}
              className="relative w-[310px] max-w-[85vw] glass-panel border-r border-slate-800 text-slate-100 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto touch-pan-y"
            >
              {/* Subtle brand gradient backdrop BEHIND mobile glass drawer */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-600/10 via-sky-500/5 to-transparent pointer-events-none" />

              {/* Swipe Left Handle Affordance on drawer edge */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full bg-slate-700/60 pointer-events-none" />

              <div className="p-4 space-y-4">
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <EllixConnectLogo size="sm" alt="Ellic Android Business OS" />
                  </div>

                  <button
                    id="btn-close-drawer"
                    onClick={onCloseMobileDrawer}
                    className="min-w-[48px] min-h-[48px] p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center"
                    aria-label="Close navigation drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Active Store & Role Summary Card */}
                {activeModule === 'admin' ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-[#161D2C] border border-sky-500/30 shadow-md space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {isSuperAdmin ? 'Superadmin Control Hub' : 'Platform Operations'}
                        </div>
                        <div className="text-[10px] text-sky-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                          <span>Root Governance · {stores.length} Outlets</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#161D2C] border border-slate-800 shadow-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sky-400 font-extrabold text-xs shrink-0">
                          {activeStore.name?.slice(0, 2).toUpperCase() || 'EM'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{activeStore.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{activeStore.city} • {activeRole.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Switch Store Button if Retailer */}
                    {activeModule === 'retailer' && (
                      <div>
                        <button
                          onClick={() => setShowStorePickerInDrawer(!showStorePickerInDrawer)}
                          className="w-full min-h-[48px] mt-1 py-2.5 px-3 rounded-lg bg-[#121826] hover:bg-slate-800 text-slate-300 text-[11px] font-semibold flex items-center justify-between border border-slate-700/60"
                        >
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-sky-400" />
                            <span>Switch Active Store</span>
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${showStorePickerInDrawer ? 'rotate-90' : ''}`} />
                        </button>

                        {showStorePickerInDrawer && (
                          <div className="mt-2 space-y-1.5 pt-1 border-t border-slate-700/40">
                            {allowedStores.map(st => (
                              <button
                                key={st.id}
                                onClick={() => {
                                  setActiveStore(st);
                                  setShowStorePickerInDrawer(false);
                                }}
                                className={`w-full min-h-[48px] text-left px-3 py-2.5 rounded-lg text-[11px] flex items-center justify-between transition-colors ${
                                  activeStore.id === st.id
                                    ? 'bg-blue-500/20 text-sky-300 font-bold border border-blue-500/30'
                                    : 'text-slate-300 hover:bg-slate-700/40'
                                }`}
                              >
                                <span className="truncate">{st.name}</span>
                                {activeStore.id === st.id && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Module Switcher Tabs (Android Segmented Button) */}
                {!isCrew && modulesList.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                      System Mode
                    </div>
                    <div
                      className="grid gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800"
                      style={{ gridTemplateColumns: `repeat(${modulesList.length}, minmax(0, 1fr))` }}
                    >
                      {modulesList.map(mod => (
                        <button
                          key={mod.id}
                          onClick={() => {
                            setActiveModule(mod.id);
                          }}
                          className={`min-h-[48px] min-w-[48px] flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                            activeModule === mod.id
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {mod.icon}
                          <span>{mod.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Drawer Links */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                    {activeModule.toUpperCase()} VIEWS
                  </div>

                  {items.map(item => {
                    const isActive =
                      activeView === item.id ||
                      (item.id === 'admin_overview' && (activeView === 'admin_dashboard' || activeView === 'overview' || activeView === 'admin_overview')) ||
                      (item.id === `admin_${activeView}`);
                    return (
                      <button
                        key={item.id}
                        id={`drawer-nav-${item.id}`}
                        onClick={() => {
                          onSelectView(item.id);
                          onCloseMobileDrawer();
                        }}
                        className={`w-full min-h-[48px] flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold shadow-md shadow-blue-500/20'
                            : 'text-slate-300 hover:bg-slate-800/80 active:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {item.icon}
                          </div>
                          <span className="text-xs">{item.label}</span>
                        </div>

                        {item.count !== undefined && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Drawer Bottom Utility & Info */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
                {/* Mobile Drawer Marketing Website / Exit Demo Return Button */}
                {onNavigateToWebsite && (
                  <button
                    id="btn-drawer-website"
                    onClick={() => {
                      onCloseMobileDrawer();
                      onNavigateToWebsite();
                    }}
                    className={`w-full min-h-[48px] py-3 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between active:scale-[0.98] transition-all shadow-sm ${
                      isDemoMode
                        ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white font-bold'
                        : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isDemoMode ? (
                        <LogOut className="w-4 h-4 text-white" />
                      ) : (
                        <Globe className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>{isDemoMode ? 'Exit Demo' : 'Marketing Website'}</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${isDemoMode ? 'text-rose-100' : 'text-emerald-400'}`}>
                      {isDemoMode ? 'Back to Website →' : 'Exit App →'}
                    </span>
                  </button>
                )}

                {/* Mobile Drawer Settings Menu Button */}
                <button
                  id="btn-drawer-settings"
                  onClick={() => {
                    onCloseMobileDrawer();
                    setIsSettingsModalOpen(true);
                  }}
                  className="w-full min-h-[48px] py-3 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between active:scale-[0.98] transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>System Settings & Theme</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>

                <div className="w-full flex items-center justify-between text-xs text-slate-300 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">Live Database Connected</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Online</span>
                </div>

                <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-400">
                    <span>←</span> Swipe left to close
                  </span>
                  <span>v2.4.0</span>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
