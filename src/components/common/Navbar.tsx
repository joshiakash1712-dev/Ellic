import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveModule, UserRole, AppRole, normalizeCanonicalRole } from '../../types';
import { NotificationCenter } from './NotificationCenter';
import { SettingsModal } from './SettingsModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { EllixConnectLogo } from '../branding/EllixConnectLogo';
import {
  Store as StoreIcon,
  Truck,
  ShieldAlert,
  Bell,
  ChevronDown,
  CheckCircle2,
  Menu,
  Settings,
  ShieldCheck,
  Zap,
  LogIn,
  LogOut,
  Smartphone,
  Mail,
  KeyRound,
  WifiOff,
  Globe
} from 'lucide-react';

interface NavbarProps {
  onOpenMobileDrawer?: () => void;
  onOpenNotifications?: () => void;
  onNavigateToWebsite?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileDrawer,
  onOpenNotifications,
  onNavigateToWebsite
}) => {
  const {
    isDemoMode,
    activeModule,
    setActiveModule,
    activeRole,
    setActiveRole,
    activeStore,
    setActiveStore,
    stores,
    currentUser: storeUser,
    unreadCount,
    theme,
    toggleTheme,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    subscription
  } = useStore();

  const {
    currentUser: rawAuthUser,
    userProfile: rawUserProfile,
    openAuthModal,
    setIsSyncHubOpen,
    logout
  } = useAuth();

  const authUser = isDemoMode ? null : rawAuthUser;
  const userProfile = isDemoMode ? null : rawUserProfile;

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const storeDropdownRef = React.useRef<HTMLDivElement>(null);
  const roleDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setShowStoreDropdown(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    if (showStoreDropdown || showRoleDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStoreDropdown, showRoleDropdown]);

  // Connectivity detection using navigator.onLine API
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const canonicalRole = normalizeCanonicalRole(activeRole);
  const isSuperAdmin =
    authUser?.email?.toLowerCase() === 'ellixorrr@gmail.com' ||
    authUser?.email?.toLowerCase() === 'joshiakash1712@gmail.com' ||
    authUser?.email?.toLowerCase() === 'superadmin@ellic.com' ||
    canonicalRole === 'super_admin' ||
    normalizeCanonicalRole(userProfile?.role) === 'super_admin';
  const isPlatformAdmin = isSuperAdmin || canonicalRole === 'ellix_admin' || normalizeCanonicalRole(userProfile?.role) === 'ellix_admin';
  const isCrew = canonicalRole === 'crew' || userProfile?.role === 'crew';
  const isClientOwner = !isCrew && !isPlatformAdmin && (canonicalRole === 'client' || userProfile?.role === 'client');
  const canShowDevRoleSwitcher = Boolean(isDemoMode || ((import.meta as any).env?.DEV && (!authUser || isSuperAdmin)));
  const allowedStores = isCrew
    ? stores.filter(s => (storeUser?.assignedStoreIds || [activeStore.id]).includes(s.id))
    : stores;

  // Global Subscription Status Indicator (FIX 9: Client only, never Crew or Admin)
  const subscriptionStatusBadge = React.useMemo(() => {
    if (!subscription || !isClientOwner || isPlatformAdmin) return null;
    const status = subscription.status || 'active';
    let daysRemaining: number | null = null;
    if (subscription.renewalDate) {
      try {
        const renDate = new Date(subscription.renewalDate);
        if (!isNaN(renDate.getTime())) {
          const diff = Math.ceil((renDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          daysRemaining = Math.max(0, diff);
        }
      } catch {
        // fallback
      }
    }

    if (status === 'past_due') {
      return {
        label: daysRemaining !== null ? `Payment Due · ${daysRemaining} days remaining` : 'Payment Due',
        classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
        dotClass: 'bg-amber-400'
      };
    }
    if (status === 'grace_period') {
      return {
        label: daysRemaining !== null ? `Grace Period · ${daysRemaining} days remaining` : 'Grace Period',
        classes: 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25',
        dotClass: 'bg-amber-400'
      };
    }
    if (status === 'blocked' || status === 'cancelled') {
      return {
        label: status === 'cancelled' ? 'Subscription Cancelled' : 'Subscription Blocked',
        classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
        dotClass: 'bg-rose-400'
      };
    }
    return {
      label: daysRemaining !== null && daysRemaining <= 30
        ? `Subscription · Renews in ${daysRemaining} days`
        : 'Subscription · Active',
      classes: 'bg-sky-500/10 text-sky-300 border-sky-500/25 hover:bg-blue-500/20',
      dotClass: 'bg-sky-400'
    };
  }, [subscription, isClientOwner]);

  const roles: { id: AppRole | UserRole; label: string; desc: string; badge?: string }[] = [
    { id: 'super_admin', label: 'Super Admin (Level 1)', desc: 'Creator & Owner: Platform Admins, Clients & System Controls', badge: 'L1' },
    { id: 'ellix_admin', label: 'Ellic Admin (Level 2)', desc: 'Operational Admin: Client approvals & subscriptions', badge: 'L2' },
    { id: 'client', label: 'Store Owner (Level 3)', desc: 'Store Owner: Multi-store inventory, crew & billing', badge: 'L3' },
    { id: 'crew', label: 'Store Crew (Level 4)', desc: 'Assigned store crew: POS billing & stock lookup', badge: 'L4' },
    { id: 'wholesaler_admin', label: 'Wholesale Partner', desc: 'B2B Catalog & Bulk Restock Orders', badge: 'B2B' }
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 text-slate-100 shadow-xl w-full max-w-full relative">
      {/* Subtle brand gradient backdrop BEHIND the glass navbar to give frosted refraction depth */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/10 via-sky-500/5 to-blue-600/10 pointer-events-none" />
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* Brand Logo & Store Picker */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            {/* Mobile Hamburger Drawer Trigger (Android Navigation Icon) */}
            <button
              id="btn-hamburger-menu"
              onClick={onOpenMobileDrawer}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center shrink-0"
              aria-label="Open Navigation Drawer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-slate-200" />
            </button>

            <div className="flex items-center gap-2">
              {/* Full logo on sm and larger screens */}
              <div className="hidden sm:flex items-center">
                <EllixConnectLogo size="sm" alt="Ellic" />
              </div>
              {/* Symbol on mobile screens */}
              <div className="sm:hidden flex items-center gap-1.5">
                <EllixConnectLogo variant="symbol" size={26} alt="Ellic" />
                <span className="text-sm font-bold tracking-tight text-white flex items-center">
                  Ellic
                </span>
              </div>

              {/* Subtle Offline Badge */}
              {!isOnline && (
                <span
                  id="badge-navbar-offline"
                  className="hidden xs:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0"
                  title="Offline: Internet connection lost (navigator.onLine). Offline-first mode is active; local data remains safe."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Offline</span>
                </span>
              )}
            </div>

            {/* Active Store Indicator / Admin Platform Badges */}
            {isSuperAdmin ? (
              <div
                id="badge-navbar-admin-super"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-300 text-xs font-bold shadow-sm"
                title="Super Admin: Root Governance & Platform Control"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate font-extrabold text-white">Super Admin · Root</span>
              </div>
            ) : isPlatformAdmin ? (
              <div
                id="badge-navbar-admin-platform"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 text-xs font-bold shadow-sm"
                title="Level 2 Platform Administrator: Managing Clients & Stores"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate font-extrabold text-white">Platform Admin</span>
              </div>
            ) : (
              <div ref={storeDropdownRef} className="relative">
                <button
                  id="btn-navbar-store-select"
                  onClick={() => {
                    setShowStoreDropdown(!showStoreDropdown);
                    setShowRoleDropdown(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm max-w-[130px] xs:max-w-[165px] sm:max-w-[230px] ${
                    isCrew
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20'
                      : 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-blue-500/20'
                  }`}
                  title={isCrew ? `Current Assigned Store: ${activeStore.name}` : `Current Active Store: ${activeStore.name}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isCrew ? 'bg-amber-400 animate-pulse' : 'bg-sky-400'}`} />
                  <StoreIcon className={`w-3.5 h-3.5 shrink-0 ${isCrew ? 'text-amber-400' : 'text-sky-400'}`} />
                  <span className="truncate font-extrabold text-white">
                    {activeStore.name}{activeStore.city ? ` · ${activeStore.city}` : ''}
                  </span>
                  {allowedStores.length > 1 && (
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </button>

                {showStoreDropdown && (
                  <div className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-xl bg-[#161D2C] border border-slate-700/80 shadow-2xl p-2 z-50">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
                      <span>Active Store</span>
                      {isCrew && <span className="text-amber-400 text-[9px] font-mono">Assigned Only</span>}
                    </div>
                    <div className="space-y-1 max-h-52 overflow-y-auto mt-1">
                      {allowedStores.map(store => (
                        <button
                          key={store.id}
                          onClick={() => {
                            setActiveStore(store);
                            setShowStoreDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            activeStore.id === store.id
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold'
                              : 'text-slate-300 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="truncate">
                            <div className="font-semibold text-slate-200 truncate">{store.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{store.address}</div>
                          </div>
                          {activeStore.id === store.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-1.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Global Subscription Status Indicator (FIX 9: Client/Store Owner only) */}
          {subscriptionStatusBadge && (
            <div className="hidden lg:flex items-center">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${subscriptionStatusBadge.classes}`}
                title="View & Manage Subscription Status"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${subscriptionStatusBadge.dotClass}`} />
                <span>{subscriptionStatusBadge.label}</span>
              </button>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Support 24/7 Text Trigger */}
            <button
              type="button"
              id="btn-navbar-support-24-7"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-support-chat', { detail: { toggle: true } }));
              }}
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap px-1.5 sm:px-2 py-1"
              title="24/7 Customer Support & Help"
            >
              Support 24/7
            </button>

            {/* Global Multi-Language Switcher */}
            <LanguageSwitcher variant="compact" />

            {/* Notification Bell */}
            <button
              id="btn-nav-notifications"
              onClick={() => onOpenNotifications ? onOpenNotifications() : setIsNotificationModalOpen(true)}
              className="relative p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0"
              title="Notifications Center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-[10px] font-extrabold text-white flex items-center justify-center border-2 border-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Exit Demo Button (in Demo Mode) or Sign In Button (Unauthenticated real app state) */}
            {isDemoMode ? (
              onNavigateToWebsite && (
                <button
                  id="btn-nav-exit-demo"
                  onClick={onNavigateToWebsite}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/25 border border-rose-400/30 shrink-0"
                  title="Exit App Demo and return to Website"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Demo</span>
                </button>
              )
            ) : (
              !authUser && (
                <button
                  id="btn-nav-sign-in"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 shrink-0"
                  title="Sign In with Google, Phone OTP or Email"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )
            )}

            {/* Role Switcher & Profile Dropdown */}
            <div ref={roleDropdownRef} className="relative shrink-0">
              <button
                onClick={() => {
                  setShowRoleDropdown(!showRoleDropdown);
                  setShowStoreDropdown(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 text-xs text-slate-200 transition-all"
              >
                {authUser?.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || 'User'}
                    className="w-7 h-7 rounded-md object-cover border border-sky-500/40 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-blue-600/30 border border-sky-500/40 flex items-center justify-center text-sky-300 font-bold text-xs shrink-0">
                    {authUser?.displayName
                      ? authUser.displayName.slice(0, 2).toUpperCase()
                      : isDemoMode && storeUser?.name
                        ? storeUser.name.slice(0, 2).toUpperCase()
                        : activeRole.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left max-w-[100px] md:max-w-[130px]">
                  <div className="text-xs font-semibold capitalize text-slate-200 leading-none flex items-center gap-1 truncate">
                    <span className="truncate">
                      {authUser?.displayName || (isDemoMode ? storeUser?.name : activeRole.replace('_', ' '))}
                    </span>
                    {authUser && <ShieldCheck className="w-3 h-3 text-sky-400 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                    {authUser ? 'Verified Account' : isDemoMode ? 'Demo Workspace' : (canShowDevRoleSwitcher ? 'Dev Role & Menu' : 'Account & Menu')}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl bg-[#161D2C] border border-slate-700/80 shadow-2xl p-2 z-50">
                  
                  {/* Authenticated User Status Bar */}
                  {authUser ? (
                    <div className="p-2.5 mb-2 rounded-lg bg-[#121826] border border-slate-700/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Identity
                        </span>
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 rounded uppercase">
                          {activeRole.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white font-semibold truncate">
                        {authUser.displayName || 'Merchant Partner'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {authUser.email || authUser.phoneNumber}
                      </div>

                      {/* Account Security Settings */}
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          setIsSyncHubOpen(true);
                        }}
                        className="w-full mt-2 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3 text-sky-400" />
                        <span>Security & Linked Credentials</span>
                      </button>
                    </div>
                  ) : isDemoMode ? (
                    <div className="p-2.5 mb-2 rounded-lg bg-[#121826] border border-sky-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                          Interactive App Demo
                        </span>
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 rounded uppercase">
                          Sample Data
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white font-semibold truncate">
                        {storeUser?.name || 'Vikram Malhotra (Demo)'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        No login required · Isolated demo data
                      </div>
                      {onNavigateToWebsite && (
                        <button
                          onClick={() => {
                            setShowRoleDropdown(false);
                            onNavigateToWebsite();
                          }}
                          className="w-full mt-2 py-1.5 px-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Exit Demo</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 mb-2 rounded-lg bg-slate-900/80 border border-slate-700/60">
                      <div className="text-xs font-semibold text-slate-300 mb-1">
                        Sign in to your account
                      </div>
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          openAuthModal('login');
                        }}
                        className="w-full py-1.5 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In / Register</span>
                      </button>
                    </div>
                  )}

                  {canShowDevRoleSwitcher && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-2 py-1">
                        {isDemoMode ? 'Switch Demo Role Perspective' : 'Select Active Role (Dev Only)'}
                      </div>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {roles.map(r => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setActiveRole(r.id);
                              if (r.id === 'wholesaler_admin') {
                                setActiveModule('wholesaler');
                              } else if (r.id === 'super_admin' || r.id === 'ellix_admin' || r.id === 'platform_admin') {
                                setActiveModule('admin');
                              } else {
                                setActiveModule('retailer');
                              }
                              setShowRoleDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                              activeRole === r.id
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold'
                                : 'text-slate-300 hover:bg-slate-700/50'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-200">{r.label}</div>
                              <div className="text-[10px] text-slate-400">{r.desc}</div>
                            </div>
                            {activeRole === r.id && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Settings and Theme in menu */}
                  <div className="mt-2 pt-2 border-t border-slate-700/80 space-y-1">
                    <button
                      id="btn-menu-settings"
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setIsSettingsModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-sky-400" />
                        <span>Settings (Theme & Preferences)</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-700">
                        {theme === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </button>

                    {authUser && (
                      <button
                        id="btn-menu-signout"
                        onClick={async () => {
                          setShowRoleDropdown(false);
                          await logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Real-time Notification Center Modal */}
      <NotificationCenter
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {/* System Settings & Theme Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

    </header>
  );
};
