import React, { useState, Suspense, lazy } from 'react';
import { EllixLandingPage } from './components/landing/EllixLandingPage';
import { LEGAL_PAGE_ROUTES, getLegalSlugFromLocation } from './config/legal.config';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { auth } from './lib/firebase';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { BottomNavigation } from './components/common/BottomNavigation';
import { AuthModal } from './components/auth/AuthModal';
import { SaveStatusToast } from './components/common/SaveStatusToast';
import { ShieldCheck, Mail, AlertCircle, X, Zap, Users } from 'lucide-react';
import { normalizeCanonicalRole } from './types';

// Lazy-loaded application views & heavy widgets to keep initial website bundle fast
const RetailerDashboard = lazy(() =>
  import('./components/retailer/RetailerDashboard').then((m) => ({ default: m.RetailerDashboard }))
);
const BillingPOS = lazy(() =>
  import('./components/retailer/BillingPOS').then((m) => ({ default: m.BillingPOS }))
);
const InventoryManager = lazy(() =>
  import('./components/retailer/InventoryManager').then((m) => ({ default: m.InventoryManager }))
);
const CustomerCRM = lazy(() =>
  import('./components/retailer/CustomerCRM').then((m) => ({ default: m.CustomerCRM }))
);
const ReportsAnalytics = lazy(() =>
  import('./components/retailer/ReportsAnalytics').then((m) => ({ default: m.ReportsAnalytics }))
);
const EmployeeRoles = lazy(() =>
  import('./components/retailer/EmployeeRoles').then((m) => ({ default: m.EmployeeRoles }))
);
const InvoiceTemplates = lazy(() =>
  import('./components/retailer/InvoiceTemplates').then((m) => ({ default: m.InvoiceTemplates }))
);
const CrewSales = lazy(() =>
  import('./components/retailer/CrewSales').then((m) => ({ default: m.CrewSales }))
);
const SupplierManager = lazy(() =>
  import('./components/retailer/SupplierManager').then((m) => ({ default: m.SupplierManager }))
);
const SubscriptionPaywall = lazy(() =>
  import('./components/subscription/SubscriptionPaywall').then((m) => ({ default: m.SubscriptionPaywall }))
);
const WholesalerPortal = lazy(() =>
  import('./components/wholesaler/WholesalerPortal').then((m) => ({ default: m.WholesalerPortal }))
);
const AdminPanel = lazy(() =>
  import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);
const CustomerJourneyMap = lazy(() =>
  import('./components/research/CustomerJourneyMap').then((m) => ({ default: m.CustomerJourneyMap }))
);
const AccountSyncHubModal = lazy(() =>
  import('./components/auth/AccountSyncHubModal').then((m) => ({ default: m.AccountSyncHubModal }))
);
const SupportChatbot = lazy(() =>
  import('./components/common/SupportChatbot').then((m) => ({ default: m.SupportChatbot }))
);

// Staggered entrance sequence for MainLayout containers (opacity 0 -> 1, translateY 12px -> 0)
const mainLayoutContainerVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
      delayChildren: 0.03,
    },
  },
};

const mainLayoutItemVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const clearTransformWhenIdle = (
  transform: { y?: number | string },
  generatedTransform: string
) => {
  if (transform.y === 0 || transform.y === '0px') {
    return 'none';
  }
  return generatedTransform;
};

// Material motion transition preset (Shared Axis with subtle scale & fade)
const pageMotionVariants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.985,
    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface MainLayoutProps {
  onNavigateToWebsite?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onNavigateToWebsite }) => {
  const {
    isDemoMode,
    activeModule,
    setActiveModule,
    subscription,
    activeRole,
    activeStore,
    stores,
    setIsSettingsModalOpen
  } = useStore();
  const { userProfile: rawUserProfile, currentUser: rawAuthUser } = useAuth();
  const authUser = isDemoMode ? null : rawAuthUser;
  const userProfile = isDemoMode ? null : rawUserProfile;
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const prefersReducedMotion = useReducedMotion();

  const canonicalRole = normalizeCanonicalRole(activeRole);
  const isSuperAdmin =
    authUser?.email?.toLowerCase() === 'ellixorrr@gmail.com' ||
    authUser?.email?.toLowerCase() === 'joshiakash1712@gmail.com' ||
    authUser?.email?.toLowerCase() === 'superadmin@ellic.com' ||
    canonicalRole === 'super_admin' ||
    normalizeCanonicalRole(userProfile?.role) === 'super_admin';
  const isPlatformAdmin = isSuperAdmin || canonicalRole === 'ellix_admin' || normalizeCanonicalRole(userProfile?.role) === 'ellix_admin';
  const isCrew = canonicalRole === 'crew';
  const isWholesaler = canonicalRole === 'wholesaler_admin';

  // Ensure Admin defaults to 'admin_overview' when in admin module
  React.useEffect(() => {
    if (activeModule === 'admin' && activeView === 'dashboard') {
      setActiveView('admin_overview');
    }
  }, [activeModule, activeView]);

  // Ensure Crew defaults to 'pos' when activeView is an owner-only view
  React.useEffect(() => {
    if (isCrew && !['pos', 'inventory', 'my_sales', 'journey_map'].includes(activeView)) {
      setActiveView('pos');
    }
  }, [isCrew, activeView]);

  const handleSelectView = React.useCallback((viewId: string) => {
    if (isCrew && !['pos', 'inventory', 'my_sales', 'journey_map'].includes(viewId)) {
      setActiveView('pos');
      return;
    }
    setActiveView(viewId);
  }, [isCrew]);

  const renderActiveView = () => {
    if (!isDemoMode && canonicalRole === 'unauthorized') {
      return (
        <div className="min-h-[420px] flex flex-col items-center justify-center text-center p-8 bg-slate-900/60 border border-rose-500/30 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 max-w-md">
            Your account is currently deactivated, suspended, or has an unrecognized role. Please contact your store administrator or Ellic support.
          </p>
        </div>
      );
    }

    // Universal journey map view accessible from any module
    if (activeView === 'journey_map') {
      return <CustomerJourneyMap />;
    }

    // Authoritative Subscription Paywall: Restrict core retail operations if blocked, cancelled, or store is paused/unpaid
    const isClient = canonicalRole === 'client' || normalizeCanonicalRole(userProfile?.role) === 'client';
    const isStorePaused = activeStore?.status === 'paused' || activeStore?.subscriptionStatus === 'unpaid';
    const isSubscriptionBlocked =
      (subscription && (subscription.status === 'blocked' || subscription.status === 'cancelled')) ||
      isStorePaused;

    if ((isClient || isCrew) && isSubscriptionBlocked) {
      return <SubscriptionPaywall />;
    }

    // Customer Account View (Default for unpromoted sign-ins)
    if (canonicalRole === 'customer') {
      return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121826] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Customer Account Portal</h2>
                <p className="text-xs text-slate-400">
                  Signed in as <strong className="text-sky-300">{userProfile?.email || 'Customer'}</strong> · Platform Role: <span className="font-semibold text-emerald-400">Customer</span>
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80 text-xs text-slate-300 space-y-2">
              <p>
                Welcome to <strong>Ellic</strong>. Your account is registered with default <strong>Customer</strong> access. You can browse connected retail outlets, review product catalogs, and view store information.
              </p>
              <p className="text-slate-400">
                Are you a store owner or merchant wanting to use Ellic POS & Inventory? Once an Ellic Administrator assigns or verifies your paid subscription, your account will be promoted to <strong>Client (Store Owner)</strong> to unlock full POS Billing, Inventory, and Khata CRM.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => handleSelectView('journey_map')}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Explore Platform Capabilities
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                Profile Settings
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300">Connected Ellic Stores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map(st => (
                <div key={st.id} className="p-4 rounded-xl bg-[#121826] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{st.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                      st.status === 'paused'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {st.status === 'paused' ? 'Paused' : 'Open'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{st.address}, {st.city}</p>
                  <p className="text-[11px] text-slate-500">Contact: {st.phone} · Timings: {st.timings}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Admin Views (Strictly Super Admin & Ellix Admin only)
    if (activeModule === 'admin') {
      if (!isPlatformAdmin) {
        return isCrew ? <BillingPOS /> : isWholesaler ? <WholesalerPortal /> : (
          <RetailerDashboard
            onNavigateToInventory={() => handleSelectView('inventory')}
            onNavigateToRestock={() => handleSelectView('inventory')}
          />
        );
      }
      if (activeView === 'journey_map') {
        return <CustomerJourneyMap />;
      }

      const mapActiveViewToAdminTab = (v: string): any => {
        if (v === 'admin_clients' || v === 'clients') return 'clients';
        if (v === 'admin_stores' || v === 'stores') return 'stores';
        if (v === 'admin_users' || v === 'users') return 'users';
        if (v === 'admin_wholesalers' || v === 'wholesalers') return 'wholesalers';
        if (v === 'admin_database' || v === 'database') return 'database';
        if (v === 'admin_security' || v === 'security') return 'security';
        if (v === 'admin_audit' || v === 'audit') return 'audit';
        return 'overview';
      };

      return (
        <AdminPanel
          initialTab={mapActiveViewToAdminTab(activeView)}
          onTabChange={(tab) => handleSelectView(`admin_${tab}`)}
        />
      );
    }

    // Wholesaler Views (Blocked for Crew)
    if (activeModule === 'wholesaler' || isWholesaler) {
      if (isCrew) {
        return <BillingPOS />;
      }
      return <WholesalerPortal />;
    }

    // Retailer Views
    if (activeModule === 'retailer') {
      if (canonicalRole === 'ellix_admin') {
        return <AdminPanel />;
      }

      if (isCrew) {
        switch (activeView) {
          case 'inventory':
            return <InventoryManager />;
          case 'my_sales':
            return <CrewSales />;
          case 'pos':
          default:
            return <BillingPOS />;
        }
      }

      switch (activeView) {
        case 'journey_map':
          return <CustomerJourneyMap />;
        case 'pos':
          return <BillingPOS />;
        case 'inventory':
          return <InventoryManager />;
        case 'suppliers':
          return <SupplierManager />;
        case 'crm':
          return <CustomerCRM />;
        case 'my_sales':
          return <CrewSales />;
        case 'templates':
          return <InvoiceTemplates />;
        case 'reports':
          return <ReportsAnalytics onNavigateToPOS={() => handleSelectView('pos')} />;
        case 'employees':
          return <EmployeeRoles />;
        case 'dashboard':
        default:
          return (
            <RetailerDashboard
              onNavigateToInventory={() => handleSelectView('inventory')}
              onNavigateToRestock={() => handleSelectView('inventory')}
              onNavigateToPOS={() => handleSelectView('pos')}
              onNavigateToWholesale={() => setActiveModule('wholesaler')}
              onNavigateToReports={() => handleSelectView('reports')}
              onNavigateToJourneyMap={() => handleSelectView('journey_map')}
            />
          );
      }
    }

    return isCrew ? (
      <BillingPOS />
    ) : (
      <RetailerDashboard
        onNavigateToInventory={() => handleSelectView('inventory')}
        onNavigateToRestock={() => handleSelectView('inventory')}
      />
    );
  };

  const {
    isTotpEnrolled,
    setIsSyncHubOpen,
    resendVerificationEmail
  } = useAuth();
  const [dismissEmailBanner, setDismissEmailBanner] = useState(false);
  const [dismissTotpBanner, setDismissTotpBanner] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const viewKey = `${activeModule}-${activeView}`;

  const securityRole = authUser?.email?.toLowerCase() === 'ellixorrr@gmail.com'
    ? 'super_admin'
    : canonicalRole;
  const isHighSecurityTargetRole = securityRole === 'client' || securityRole === 'super_admin';

  const showTotpAdvisory = Boolean(
    !isDemoMode &&
    authUser &&
    isHighSecurityTargetRole &&
    !isTotpEnrolled &&
    !dismissTotpBanner
  );

  const hasUnverifiedEmail = Boolean(
    !isDemoMode &&
    authUser &&
    authUser.email &&
    !authUser.emailVerified &&
    !authUser.providerData.some(p => p.providerId === 'google.com') &&
    !dismissEmailBanner
  );

  return (
    <motion.div
      variants={mainLayoutContainerVariants}
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      className="ellix-app-shell min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden transition-colors duration-200"
    >
      
      {/* Top Main Navigation */}
      <motion.div
        variants={mainLayoutItemVariants}
        transformTemplate={clearTransformWhenIdle}
        className="sticky top-0 z-40 w-full"
      >
        <Navbar
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onNavigateToWebsite={onNavigateToWebsite}
        />
      </motion.div>

      {/* Unverified Email Security Banner */}
      {hasUnverifiedEmail && (
        <motion.div
          variants={mainLayoutItemVariants}
          transformTemplate={clearTransformWhenIdle}
          className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Verify Email:</strong> Please verify <strong>{authUser?.email}</strong> for full permissions and account recovery.
            </span>
            <button
              onClick={async () => {
                try {
                  await resendVerificationEmail();
                  setResendStatus('Verification link sent!');
                } catch {
                  setResendStatus('Failed to send link.');
                }
              }}
              className="underline font-bold hover:text-white transition-colors ml-1"
            >
              {resendStatus || 'Resend verification link'}
            </button>
            <span className="text-amber-400/60">•</span>
            <button
              onClick={() => setIsSyncHubOpen(true)}
              className="text-amber-300 font-semibold hover:underline flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Manage Account</span>
            </button>
          </div>
          <button
            onClick={() => setDismissEmailBanner(true)}
            className="p-1 text-amber-300 hover:text-white"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Client & Super Admin TOTP 2FA Security Advisory Banner */}
      {showTotpAdvisory && (
        <motion.div
          variants={mainLayoutItemVariants}
          transformTemplate={clearTransformWhenIdle}
          className="bg-sky-950/70 border-b border-sky-500/30 px-4 py-2 flex items-center justify-between text-xs text-sky-200"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong>High-Security Account ({securityRole === 'super_admin' ? 'Super Admin' : 'Store Owner / Client'}):</strong> TOTP Two-Factor Authentication is recommended to protect administrative operations.
            </span>
            <button
              onClick={() => setIsSyncHubOpen(true)}
              className="underline font-bold text-sky-300 hover:text-white transition-colors ml-1 flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Enable 2FA in Sync Hub</span>
            </button>
          </div>
          <button
            onClick={() => setDismissTotpBanner(true)}
            className="p-1 text-sky-400 hover:text-white"
            title="Dismiss security advisory"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Body Layout */}
      <motion.div
        variants={mainLayoutItemVariants}
        transformTemplate={clearTransformWhenIdle}
        className="flex-1 flex flex-col md:flex-row w-full max-w-full min-w-0 overflow-x-hidden"
      >
        
        {/* Module Sub-navigation Sidebar, Collapsible Drawer & Bottom Nav */}
        <Sidebar
          activeView={activeView}
          onSelectView={handleSelectView}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onNavigateToWebsite={onNavigateToWebsite}
        />

        {/* Main Workstage Content View with Motion Transitions & Safe Area Padding for Bottom Bar */}
        <motion.main
          variants={mainLayoutItemVariants}
          transformTemplate={clearTransformWhenIdle}
          className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 w-full max-w-7xl mx-auto overflow-x-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              id={`view-stage-${viewKey}`}
              key={viewKey}
              variants={pageMotionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-full h-full will-change-transform min-w-0 overflow-x-hidden"
            >
              <Suspense
                fallback={
                  <div className="w-full min-h-[320px] flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500/30 border-t-sky-400 animate-spin" />
                  </div>
                }
              >
                {renderActiveView()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </motion.main>

      </motion.div>

      {/* Persistent Native Android-style Bottom Navigation for Mobile Critical Actions */}
      <BottomNavigation
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
        isMenuOpen={isMobileDrawerOpen}
      />

    </motion.div>
  );
};

// Dedicated Website Page (Route: /)
const WebsitePage: React.FC<{ onNavigateToApp: () => void; onLaunchDemo: () => void }> = ({
  onNavigateToApp,
  onLaunchDemo,
}) => {
  return (
    <>
      <EllixLandingPage onLaunchApp={onNavigateToApp} onLaunchDemo={onLaunchDemo} />
      <AuthModal />
    </>
  );
};

// App Demo Mode — Renders the actual application with isolated fake/mock data, without login or real user data
const DemoApplicationPage: React.FC<{ onExitDemo: () => void }> = ({ onExitDemo }) => {
  return (
    <StoreProvider isDemoMode={true}>
      <MainLayout onNavigateToWebsite={onExitDemo} />
    </StoreProvider>
  );
};

// Dedicated Real Client Application Page (Route: /app — Protected against direct reach)
const ApplicationPage: React.FC<{ onNavigateToWebsite: () => void }> = ({ onNavigateToWebsite }) => {
  return (
    <>
      <MainLayout onNavigateToWebsite={onNavigateToWebsite} />
      {/* Application Auth, Sync Hub & Save Status Modals */}
      <AuthModal />
      <Suspense fallback={null}>
        <AccountSyncHubModal />
      </Suspense>
      <SaveStatusToast />
    </>
  );
};

function isAppUrlPath(): boolean {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const hash = window.location.hash.toLowerCase();
  return (
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/demo' ||
    pathname.startsWith('/demo/') ||
    hash === '#app' ||
    hash === '#admin' ||
    hash === '#demo'
  );
}

const AppContent: React.FC = () => {
  const { currentUser, loading: isAuthLoading, openAuthModal } = useAuth();
  // Prevent direct URL reach to /app: only allow entry when explicitly launched from an authenticated session
  const hasAuthorizedAppEntryRef = React.useRef<boolean>(false);
  const [currentPage, setCurrentPage] = useState<'website' | 'demo' | 'app'>('website');

  // Block any direct reach to /app or /#app on initial load or unauthenticated state
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const enforceRouteProtection = () => {
      if (isAppUrlPath()) {
        if (!hasAuthorizedAppEntryRef.current || (!isAuthLoading && !currentUser)) {
          try {
            window.history.replaceState({}, '', '/');
          } catch {
            // ignore history errors
          }
          setCurrentPage('website');
          return;
        }
        setCurrentPage('app');
      } else {
        setCurrentPage(prev => (prev === 'demo' ? 'demo' : 'website'));
      }
    };

    enforceRouteProtection();

    window.addEventListener('popstate', enforceRouteProtection);
    window.addEventListener('hashchange', enforceRouteProtection);
    return () => {
      window.removeEventListener('popstate', enforceRouteProtection);
      window.removeEventListener('hashchange', enforceRouteProtection);
    };
  }, [currentUser, isAuthLoading]);

  // Automatically return to Website page (/) if user signs out while inside ApplicationPage (/app)
  React.useEffect(() => {
    if (!isAuthLoading && !currentUser && currentPage === 'app') {
      hasAuthorizedAppEntryRef.current = false;
      try {
        window.history.replaceState({}, '', '/');
      } catch {
        // ignore
      }
      setCurrentPage('website');
    }
  }, [currentUser, isAuthLoading, currentPage]);

  // Log visitor session telemetry for platform analytics
  React.useEffect(() => {
    try {
      let sessionId = sessionStorage.getItem('ellic_session_id');
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('ellic_session_id', sessionId);
      }
      fetch('/api/telemetry/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const isPublicWebsite = currentPage === 'website';
      const legalSlug = isPublicWebsite ? getLegalSlugFromLocation() : null;
      const legalRoute = legalSlug ? LEGAL_PAGE_ROUTES[legalSlug] : null;
      document.title =
        currentPage === 'app'
          ? 'Ellic OS: Retail & POS Application'
          : currentPage === 'demo'
            ? 'Ellic OS: Interactive App Demo'
            : legalRoute
              ? `${legalRoute.title} | Ellic`
              : 'Ellic: Business Management, Without the Complexity';

      const robotsValue = isPublicWebsite
        ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'noindex, nofollow';
      const googlebotValue = isPublicWebsite
        ? 'index, follow, max-snippet:-1, max-image-preview:large'
        : 'noindex, nofollow';

      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        robotsMeta.setAttribute('content', robotsValue);
      }
      const googlebotMeta = document.querySelector('meta[name="googlebot"]');
      if (googlebotMeta) {
        googlebotMeta.setAttribute('content', googlebotValue);
      }
      if (!isPublicWebsite) {
        const canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
          canonicalLink.setAttribute('href', 'https://ellic.ai.studio/');
        }
        const ogUrlMeta = document.querySelector('meta[property="og:url"]');
        if (ogUrlMeta) {
          ogUrlMeta.setAttribute('content', 'https://ellic.ai.studio/');
        }
      }
    }
  }, [currentPage]);

  const navigateToPage = (targetPage: 'website' | 'demo' | 'app') => {
    if (targetPage === 'app') {
      // Prevent direct reach if not authenticated
      if (!authUserIsSignedIn(currentUser)) {
        openAuthModal('login');
        return;
      }
      hasAuthorizedAppEntryRef.current = true;
      try {
        if (window.location.pathname !== '/app' || window.location.hash === '#app') {
          window.history.pushState({}, '', '/app');
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      } catch {
        // ignore
      }
      setCurrentPage('app');
    } else if (targetPage === 'demo') {
      hasAuthorizedAppEntryRef.current = false;
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      } catch {
        // ignore
      }
      setCurrentPage('demo');
    } else {
      hasAuthorizedAppEntryRef.current = false;
      try {
        if (window.location.pathname !== '/' || window.location.hash === '#app') {
          window.history.pushState({}, '', '/');
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      } catch {
        // ignore
      }
      setCurrentPage('website');
    }
  };

  return (
    <>
      {currentPage === 'app' && hasAuthorizedAppEntryRef.current && authUserIsSignedIn(currentUser) ? (
        <ApplicationPage onNavigateToWebsite={() => navigateToPage('website')} />
      ) : currentPage === 'demo' ? (
        <DemoApplicationPage onExitDemo={() => navigateToPage('website')} />
      ) : (
        <WebsitePage
          onNavigateToApp={() => navigateToPage('app')}
          onLaunchDemo={() => navigateToPage('demo')}
        />
      )}
      {/* 24/7 Customer Support Chatbot - accessible from headers across the platform */}
      <Suspense fallback={null}>
        <SupportChatbot />
      </Suspense>
    </>
  );
};

function authUserIsSignedIn(currentUser: unknown): boolean {
  return Boolean(currentUser || auth.currentUser);
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <StoreProvider>
            <AppContent />
          </StoreProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

