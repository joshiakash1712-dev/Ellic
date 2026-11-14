import React, { useState, useEffect } from 'react';
import { MarketingModal } from './MarketingModal';
import { useAuth } from '../../../context/AuthContext';
import { EllixConnectLogo } from '../../branding/EllixConnectLogo';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Mail,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Phone,
  LogOut,
} from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToGetStarted?: () => void;
  onLaunchApp?: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSwitchToGetStarted,
  onLaunchApp
}) => {
  const {
    currentUser,
    userProfile,
    loginWithGoogle,
    loginWithEmail,
    openAuthModal,
    mfaResolver,
    logout
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mfaResolver) {
      onClose();
    }
  }, [mfaResolver, onClose]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      setSuccessMessage('Successfully signed in with Google account! Cloud data is synced.');
      if (onLaunchApp) {
        setTimeout(() => {
          onClose();
          onLaunchApp();
        }, 600);
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed or dismissed the popup intentionally
        setErrorMessage(null);
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups or open in a new tab.');
      } else {
        setErrorMessage(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithEmail(email, password);
      setSuccessMessage('Successfully signed in! Workspace data is synced.');
      if (onLaunchApp) {
        setTimeout(() => {
          onClose();
          onLaunchApp();
        }, 600);
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please try again in a few moments.');
      } else {
        setErrorMessage(err.message || 'Sign in failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingModal
      isOpen={isOpen}
      onClose={onClose}
      title="Merchant Portal Sign In"
      subtitle="Unified authentication with Google, Phone OTP, and synchronized credentials."
    >
      <div className="space-y-4">
        {/* Brand Logo Header */}
        <div className="flex justify-center pb-1">
          <EllixConnectLogo size="sm" />
        </div>
        
        {/* Already Authenticated Banner */}
        {currentUser ? (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-blue-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-sky-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Currently Signed In
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 font-semibold border border-blue-300 dark:border-blue-800">
                Cloud Synced
              </span>
            </div>

            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-10 h-10 rounded-xl object-cover border border-blue-500/40"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-600 dark:text-sky-300 font-bold flex items-center justify-center border border-blue-500/40">
                  {(currentUser.displayName || currentUser.email || 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.displayName || 'Merchant Partner'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.email || currentUser.phoneNumber || 'Authenticated User'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {onLaunchApp && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchApp();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>
                    {userProfile?.role === 'ellix_admin' || userProfile?.role === 'super_admin'
                      ? 'Open Admin Console'
                      : 'Open Merchant Workspace'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setSuccessMessage('Signed out successfully.');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">{successMessage}</div>
              </div>
            )}

            {/* 1-Click Google Sign In */}
            <button
              id="btn-signin-google-modal"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full min-h-[44px] sm:min-h-[48px] py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs hover:shadow active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google (1-Click)</span>
            </button>

            {/* Symmetrical Alternative Divider */}
            <div className="relative flex items-center my-3 sm:my-3.5">
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
              <span className="shrink-0 px-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
                Or email & password
              </span>
              <div className="grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3 sm:space-y-3.5">
              <div>
                <label htmlFor="signin-email-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store or Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signin-email-input"
                    type="email"
                    required
                    inputMode="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@retail.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="signin-password-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openAuthModal('forgot_password');
                    }}
                    className="text-[11px] text-blue-600 dark:text-sky-400 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your synchronized password"
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* RBAC Enterprise Security Notice */}
              <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">Enterprise RBAC Enforced:</strong> User roles (Retailer, Wholesaler, Manager, Cashier) and permissions are configured centrally by your organization Administrator.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-950/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Alternative Auth Methods */}
            <div className="pt-2 flex items-center justify-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal('phone');
                }}
                className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 flex items-center gap-1 font-semibold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone SMS OTP</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal('register');
                }}
                className="text-blue-600 dark:text-sky-400 font-semibold hover:underline"
              >
                Create new account
              </button>
            </div>
          </>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            End-to-end encrypted Firestore sync
          </span>
          {onSwitchToGetStarted && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToGetStarted();
              }}
              className="font-semibold text-blue-600 dark:text-sky-400 hover:underline"
            >
              Request onboarding trial →
            </button>
          )}
        </div>
      </div>
    </MarketingModal>
  );
};

