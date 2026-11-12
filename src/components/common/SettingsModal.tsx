import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Moon,
  Sun,
  Monitor,
  Check,
  Sparkles,
  Sliders,
  Database,
  RotateCcw,
  Volume2,
  VolumeX,
  Shield,
  Palette,
  Eye,
  Zap,
  Info,
  Bot,
  ExternalLink,
  FileText,
  CheckCircle2,
  CreditCard,
  Calendar,
  ShieldAlert,
  Trash2,
  Lock,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { normalizeCanonicalRole } from '../../types';
import { EllixConnectLogo } from '../branding/EllixConnectLogo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LanguageIcon } from './LanguageIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    toggleTheme,
    products,
    invoices,
    customers,
    activeStore,
    resetToDefaultData,
    subscription,
    renewSubscription,
    cancelSubscriptionAndDeleteData,
    activeRole
  } = useStore();

  const [activeSettingsTab, setActiveSettingsTab] = React.useState<'appearance' | 'subscription' | 'data' | 'about'>('appearance');
  const [resetConfirmOpen, setResetConfirmOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [isRenewing, setIsRenewing] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [cancelConfirmName, setCancelConfirmName] = React.useState('');
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [cancellationCompleted, setCancellationCompleted] = React.useState(false);
  const [wipedStoreName, setWipedStoreName] = React.useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      await renewSubscription();
      showToast('Subscription renewed successfully! Next 30 days added.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to renew subscription.');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCancelAndWipe = async () => {
    if (cancelConfirmName.trim().toLowerCase() !== activeStore.name.trim().toLowerCase() && cancelConfirmName.trim() !== 'DELETE') {
      showToast('Confirmation store name does not match.');
      return;
    }
    const storeNameToWipe = activeStore.name;
    setIsCancelling(true);
    try {
      const ok = await cancelSubscriptionAndDeleteData(cancelConfirmName);
      if (ok) {
        setWipedStoreName(storeNameToWipe);
        setCancellationCompleted(true);
      } else {
        showToast('Cancellation failed. Please check the store name.');
      }
    } catch {
      showToast('Cancellation failed.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 animate-in fade-in duration-200"
    >
      <motion.div
        id="settings-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] glass-panel relative transition-colors ${
          theme === 'light'
            ? 'text-slate-900'
            : 'text-slate-100'
        }`}
      >
        {/* Subtle brand gradient backdrop BEHIND the glass modal */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/15 via-slate-900/60 to-sky-500/15 pointer-events-none" />

        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between transition-colors ${
            theme === 'light' ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-md shadow-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>System Settings</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    theme === 'light'
                      ? 'bg-sky-100 text-blue-800 border border-sky-300'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}
                >
                  Preferences
                </span>
              </h2>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Theme, display contrast, storage & environment preferences
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              theme === 'light'
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          className={`px-4 pt-3 border-b flex gap-2 overflow-x-auto no-scrollbar ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          {[
            { id: 'appearance', label: 'Appearance & Theme', icon: <Palette className="w-3.5 h-3.5 shrink-0" /> },
            ...(normalizeCanonicalRole(activeRole) !== 'crew' ? [
              { id: 'subscription', label: 'Subscription & Billing', icon: <CreditCard className="w-3.5 h-3.5 shrink-0" /> },
              { id: 'data', label: 'Storage & Diagnostics', icon: <Database className="w-3.5 h-3.5 shrink-0" /> }
            ] : []),
            { id: 'about', label: 'About System', icon: <Info className="w-3.5 h-3.5 shrink-0" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap shrink-0 ${
                activeSettingsTab === tab.id
                  ? 'border-sky-500 text-blue-600 dark:text-sky-400'
                  : theme === 'light'
                  ? 'border-transparent text-slate-600 hover:text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 bg-sky-500/20 text-sky-400 border-b border-sky-500/30 text-xs font-bold flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          {/* ------------------------------------------------ */}
          {/* TAB 1: APPEARANCE & THEME                        */}
          {/* ------------------------------------------------ */}
          {activeSettingsTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Color Theme & Display Mode
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                  Choose between the dark OLED/midnight palette and a high-contrast daylight theme designed for sharp outdoor legibility.
                </p>

                {/* Theme Selector Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dark Theme Card */}
                  <div
                    id="theme-card-dark"
                    onClick={() => {
                      setTheme('dark');
                      showToast('Switched to Dark Theme');
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer border-2 transition-all flex flex-col justify-between ${
                      theme === 'dark'
                        ? 'border-sky-500 bg-slate-900/90 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                        : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                            <Moon className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                              <span>Dark Theme</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Midnight Slate</span>
                          </div>
                        </div>
                        {theme === 'dark' && (
                          <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Visual Mini Mockup */}
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-2 rounded bg-slate-800" />
                          <div className="w-4 h-2 rounded bg-sky-500" />
                        </div>
                        <div className="w-full h-3 rounded bg-slate-900 border border-slate-800" />
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <div className="h-4 rounded bg-slate-900 border border-slate-800" />
                          <div className="h-4 rounded bg-slate-900 border border-slate-800" />
                          <div className="h-4 rounded bg-sky-500/20 border border-sky-500/40" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>POS & Night Terminal</span>
                      <span className="text-sky-400 font-bold">{theme === 'dark' ? 'Active' : 'Select'}</span>
                    </div>
                  </div>

                  {/* High-Contrast Light Theme Card */}
                  <div
                    id="theme-card-light"
                    onClick={() => {
                      setTheme('light');
                      showToast('Switched to High-Contrast Light Theme');
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer border-2 transition-all flex flex-col justify-between ${
                      theme === 'light'
                        ? 'border-blue-600 bg-white text-slate-900 shadow-xl shadow-slate-300 ring-2 ring-blue-500/20'
                        : 'border-slate-300 bg-slate-100 text-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                            <Sun className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>High-Contrast Light</span>
                            </div>
                            <span className="text-[10px] text-slate-600">Crisp Daylight White</span>
                          </div>
                        </div>
                        {theme === 'light' && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Visual Mini Mockup */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-2 rounded bg-slate-300" />
                          <div className="w-4 h-2 rounded bg-blue-600" />
                        </div>
                        <div className="w-full h-3 rounded bg-white border border-slate-300 shadow-sm" />
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <div className="h-4 rounded bg-white border border-slate-300" />
                          <div className="h-4 rounded bg-white border border-slate-300" />
                          <div className="h-4 rounded bg-sky-100 border border-sky-400" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Daylight & Retail Counter</span>
                      <span className="text-blue-700 font-bold">{theme === 'light' ? 'Active' : 'Select'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Toggle Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/20 text-blue-600 dark:text-sky-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Direct Theme Switch</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Currently using {theme === 'dark' ? 'Dark Theme' : 'High-Contrast Light Theme'}
                    </div>
                  </div>
                </div>

                <button
                  id="btn-toggle-theme-switch"
                  onClick={toggleTheme}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                    theme === 'light'
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>

              {/* Display Attributes */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Ergonomics & Accessibility
                </h4>
                <div
                  className={`divide-y rounded-xl border text-xs ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 divide-slate-200 text-slate-800'
                      : 'bg-slate-900/60 border-slate-800 divide-slate-800 text-slate-200'
                  }`}
                >
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold">High-Contrast Borders & Typography</div>
                      <div className="text-[11px] text-slate-500">Optimized WCAG AA readability for ambient lighting</div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      Enforced
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold">Hardware Accelerated Transitions</div>
                      <div className="text-[11px] text-slate-500">Motion smooth layouts across all modules</div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Language & Localization Settings */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <LanguageIcon className="w-4 h-4 text-sky-500" variant="gradient" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Application Language
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose your preferred language (English, हिन्दी, मराठी). Your preference is saved automatically across sessions.
                </p>
                <div
                  className={`p-4 rounded-xl border ${
                    theme === 'light'
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <LanguageSwitcher variant="panel" />
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------ */}
          {/* TAB: SUBSCRIPTION & BILLING                      */}
          {/* ------------------------------------------------ */}
          {activeSettingsTab === 'subscription' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Tenant Subscription & Cloud Billing
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Manage your Ellic monthly SaaS subscription, renewal schedules, and tenant data safety.
                </p>
              </div>

              {/* Status Alert Banner */}
              {subscription.status === 'grace_period' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-amber-300">Renewal Overdue: Grace Period Active</div>
                    <div className="text-slate-300 mt-0.5">
                      Your monthly subscription payment was due on {subscription.renewalDate}. Please renew immediately to avoid suspension of store operations.
                    </div>
                  </div>
                </div>
              )}

              {subscription.status === 'blocked' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-rose-300">Account Blocked: Renewal Required</div>
                    <div className="text-slate-300 mt-0.5">
                      The 7-day grace period has expired. Platform POS, inventory adjustments, and reports are locked until the subscription is renewed.
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Card */}
              <div
                className={`p-4 rounded-xl border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#121826] border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">Current Plan</span>
                    <h4 className="text-base font-extrabold text-white">Ellic: Growth Tier</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Full POS, inventory sync, multi-store & crew access</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${
                        subscription.status === 'active'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : subscription.status === 'past_due' || subscription.status === 'grace_period'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : subscription.status === 'blocked' || subscription.status === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {subscription.status === 'active' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      ) : subscription.status === 'past_due' || subscription.status === 'grace_period' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span>
                        {subscription.status === 'past_due'
                          ? 'Payment Due'
                          : subscription.status.replace('_', ' ')}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-800/60 text-xs tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Monthly Fee</span>
                    <span className="text-white font-extrabold text-sm">₹{subscription.priceMonthly || 1499}</span>
                    <span className="text-[10px] text-slate-400 block">/ month</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Renewal Date</span>
                    <span className="text-white font-bold">{subscription.renewalDate || 'Next 30 Days'}</span>
                    <span className="text-[10px] text-slate-400 block">Auto-recurring</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Client ID</span>
                    <span className="text-white font-mono font-bold truncate block">{activeStore.clientId || 'client-001'}</span>
                    <span className="text-[10px] text-slate-400 block">Tenant Root</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Active Store</span>
                    <span className="text-white font-bold truncate block">{activeStore.name}</span>
                    <span className="text-[10px] text-sky-400 block">{activeStore.city || 'India'}</span>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Includes 24/7 cloud sync, automatic off-peak backups & GST invoicing</span>
                  </div>
                  <button
                    onClick={handleRenew}
                    disabled={isRenewing}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isRenewing ? 'Processing Payment...' : `Renew for 30 Days (₹${subscription.priceMonthly || 1499})`}</span>
                  </button>
                </div>
              </div>

              {/* Cancellation Completed Final Message */}
              {cancellationCompleted ? (
                <div className="p-6 rounded-2xl border border-rose-500/40 bg-rose-950/40 text-center space-y-4 animate-in fade-in duration-200">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">Subscription Cancelled & Data Wiped</h4>
                    <p className="text-xs text-rose-200/90 mt-1 max-w-md mx-auto leading-relaxed">
                      Your subscription for <strong className="text-white">{wipedStoreName}</strong> has been cancelled. All associated inventory records, POS transactions, Khata accounts, and customer logs have been permanently erased from the database.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setCancellationCompleted(false);
                        setShowCancelDialog(false);
                        onClose();
                        window.location.href = '/';
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      Return to Home / Sign In
                    </button>
                  </div>
                </div>
              ) : (
                /* Danger Zone: Immediate Data Wipe on Cancellation */
                <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">
                      Danger Zone · Subscription Cancellation & Data Deletion
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cancelling your subscription will immediately and permanently erase all cloud and local records for <strong>{activeStore.name}</strong>. This action is irreversible.
                  </p>

                  <div className="text-[11px] text-rose-300/80 bg-rose-950/30 p-3 rounded-xl border border-rose-500/20 space-y-1">
                    <div className="font-semibold text-rose-200">Permanent data loss includes:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                      <li>All POS sales bills and formal invoices</li>
                      <li>Products catalog, inventory levels, and barcode records</li>
                      <li>Khata (Store Credit) ledgers and customer balances</li>
                      <li>Supplier lists and restocking history</li>
                    </ul>
                  </div>

                  {!showCancelDialog ? (
                    <button
                      onClick={() => setShowCancelDialog(true)}
                      className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Initiate Cancellation Flow</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/50 space-y-3">
                      <div className="text-xs text-slate-300 font-medium">
                        To permanently destroy all business data, type the store name: <strong className="text-white select-all">{activeStore.name}</strong>
                      </div>
                      <input
                        type="text"
                        value={cancelConfirmName}
                        onChange={(e) => setCancelConfirmName(e.target.value)}
                        placeholder={`Type "${activeStore.name}" or "DELETE"`}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleCancelAndWipe}
                          disabled={isCancelling || (!cancelConfirmName.trim())}
                          className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isCancelling ? 'Deleting Business Data...' : 'Confirm & Permanently Wipe Store Data'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowCancelDialog(false);
                            setCancelConfirmName('');
                          }}
                          className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------ */}
          {/* TAB 2: STORAGE & DIAGNOSTICS                     */}
          {/* ------------------------------------------------ */}
          {activeSettingsTab === 'data' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Local Ledger & State Diagnostics
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                  Ellic maintains instant offline persistence for inventory, invoices, and B2B orders.
                </p>
              </div>

              <div
                className={`grid grid-cols-3 gap-2.5 p-3.5 rounded-xl border text-center ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-base font-extrabold text-blue-600 dark:text-sky-400">{products.length}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Products</div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-400">{invoices.length}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Invoices</div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{customers.length}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Customers</div>
                </div>
              </div>

              {/* Cloud Database & Account Sync Status */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  theme === 'light' ? 'bg-sky-50/60 border-sky-200' : 'bg-slate-950 border-sky-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(37, 99, 235,0.8)]" />
                    <span className="text-xs font-bold text-blue-800 dark:text-sky-300">
                      Cloud Firestore & Account Sync
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                    Active
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="font-medium">Firebase Project:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">nice-unity-1mbw7</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="font-medium">Database ID:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title="ai-studio-ellixconnect-badaa1a3-33f3-40fb-a0e7-a5f5c05ebc53">
                      ai-studio-ellixconnect...
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[11px]">
                    <span className="font-medium">Sync Protocol:</span>
                    <span className="text-blue-600 dark:text-sky-400 font-semibold">Bidirectional Real-Time Snapshots</span>
                  </div>
                </div>
              </div>

              {/* Reset Data Danger Zone */}
              <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-red-600 dark:text-red-400">Restore Factory Default Database</div>
                  <button
                    id="btn-reset-factory-data"
                    onClick={() => setResetConfirmOpen(!resetConfirmOpen)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
                  >
                    Reset Data
                  </button>
                </div>
                <p className="text-[11px] text-red-700/80 dark:text-red-300/80">
                  Reload initial factory inventory catalog, customer ledgers, and standard system records.
                </p>

                {resetConfirmOpen && (
                  <div className="pt-2 border-t border-red-500/20 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setResetConfirmOpen(false)}
                      className="px-3 py-1 rounded text-xs font-semibold text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        resetToDefaultData();
                        setResetConfirmOpen(false);
                        showToast('Database reset to clean defaults');
                      }}
                      className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs font-bold"
                    >
                      Confirm Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------ */}
          {/* TAB 3: ABOUT                                     */}
          {/* ------------------------------------------------ */}
          {activeSettingsTab === 'about' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <EllixConnectLogo variant="symbol" size={40} alt="Ellic" />
                <div>
                  <h4 className="text-sm font-extrabold">Ellic Business OS</h4>
                  <p className="text-xs text-slate-500">Version 2.4.0 • Enterprise Edition</p>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2 leading-relaxed ${
                  theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/40 border-slate-800 text-slate-300'
                }`}
              >
                <p>
                  Unified cloud & edge business operating system tailored for retail shopkeepers, multi-branch outlets, and B2B FMCG wholesalers.
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Store Node: {activeStore.name}</span>
                  <span className="text-blue-600 dark:text-sky-400 font-bold">Online & Active</span>
                </div>
              </div>

              {/* AI & Machine Discoverability Info Card */}
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                  theme === 'light' ? 'bg-sky-50/60 border-sky-200 text-slate-800' : 'bg-blue-950/20 border-sky-800/60 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-sky-400">
                    <Bot className="w-4 h-4" /> AI & Crawler Discoverability
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-blue-900 text-blue-800 dark:text-sky-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live Metadata
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Non-blank metadata, Schema.org JSON-LD, standard <code>llms.txt</code>, and <code>/api/about</code> structured data are active for AI assistants (ChatGPT, Gemini, Perplexity) and search engines.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                  <a
                    href="/llms.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-sky-200 dark:border-blue-700/60 hover:text-blue-600 dark:hover:text-sky-400 inline-flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    <span>llms.txt</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                  <a
                    href="/api/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-sky-200 dark:border-blue-700/60 hover:text-blue-600 dark:hover:text-sky-400 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>/api/about</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
            theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Theme: <strong className={theme === 'light' ? 'text-slate-900' : 'text-slate-200'}>{theme === 'light' ? 'High-Contrast Light' : 'Dark Theme'}</strong></span>
          </div>

          <button
            id="btn-settings-done"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
