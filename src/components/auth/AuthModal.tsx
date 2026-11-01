import React, { useState, useEffect, useRef } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { useAuth, AuthModalMode } from '../../context/AuthContext';
import { EllixConnectLogo } from '../branding/EllixConnectLogo';
import { LEGAL_CONFIG, recordConsentAudit } from '../../config/legal.config';
import {
  X,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Smartphone,
  KeyRound,
  User,
  ExternalLink
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    setUpPhoneRecaptcha,
    sendPhoneOtp,
    confirmPhoneOtp,
    sendPasswordReset,
    mfaResolver,
    resolveTotpSignIn,
    cancelMfaSignIn
  } = useAuth();

  // Mode state
  const [mode, setMode] = useState<AuthModalMode>(authModalMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Phone OTP states
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // TOTP 2FA states
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const totpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const loginEmailRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const registerNameRef = useRef<HTMLInputElement | null>(null);
  const forgotEmailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMode(authModalMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [authModalMode, isAuthModalOpen]);

  // Resend OTP countdown
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isAuthModalOpen) return null;

  // Clear errors when typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  // Google 1-Click
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      setSuccessMessage('Successfully signed in with verified Google account.');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed or dismissed the popup intentionally
        setErrorMessage(null);
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups or open in a new tab.');
      } else {
        setErrorMessage(err?.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Email Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithEmail(email, password);
      setSuccessMessage('Successfully logged in.');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please reset password or try again later.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Email Registration (Roles are assigned solely by Admins)
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }
    if (!acceptedLegalTerms) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await registerWithEmail(email, password, displayName, 'customer');
      recordConsentAudit({
        context: 'registration',
        subjectIdentifier: email.trim(),
        purposeSummary: 'User account creation and authentication consent (DPDPA 2023)',
      });
      setSuccessMessage('Account registered successfully. A verification link has been sent to your email.');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists. Try signing in or synchronize password.');
      } else {
        setErrorMessage(err.message || 'Registration failed. Please check inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Dispatch
  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 7) {
      setErrorMessage('Please enter a valid mobile phone number.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const verifier = setUpPhoneRecaptcha('recaptcha-verifier-element');
      const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      const result = await sendPhoneOtp(fullPhone, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setResendTimer(60);
      setSuccessMessage(`6-digit verification code sent via SMS to ${fullPhone}`);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-phone-number') {
        setErrorMessage('Invalid phone number format. Please check the country code and digits.');
      } else if (code === 'auth/quota-exceeded') {
        setErrorMessage('SMS verification quota exceeded. Please try Google Sign In or Email.');
      } else {
        setErrorMessage(err.message || 'Unable to send SMS verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpCode.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP received via SMS.');
      return;
    }
    if (!confirmationResult) {
      setErrorMessage('Session expired. Please request a new verification code.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await confirmPhoneOtp(confirmationResult, fullOtp, displayName || undefined, 'customer');
      setSuccessMessage('Phone number verified successfully! Account synchronized.');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-verification-code') {
        setErrorMessage('Incorrect verification code. Please check SMS and enter the 6 digits.');
      } else if (code === 'auth/code-expired') {
        setErrorMessage('Verification code has expired. Please tap "Resend Code".');
      } else {
        setErrorMessage(err.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const newOtp = [...otpCode];
    newOtp[index] = clean.slice(-1);
    setOtpCode(newOtp);

    // Auto advance
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your account email to receive a password reset link.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordReset(email);
      setSuccessMessage(`Password reset link dispatched to ${email}. Check your inbox or spam.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  // TOTP 2FA Verification Handler
  const handleTotpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const newDigits = [...totpDigits];
    newDigits[index] = clean.slice(-1);
    setTotpDigits(newDigits);

    if (clean && index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      totpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = totpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit code from your authenticator app.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await resolveTotpSignIn(fullCode);
      setSuccessMessage('Two-Factor Authentication verified successfully!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Two-Factor verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTotp = () => {
    cancelMfaSignIn();
    setMode('login');
    setTotpDigits(['', '', '', '', '', '']);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 animate-fadeIn">
      {/* Container Card */}
      <div className="relative w-full max-w-lg glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Subtle brand gradient backdrop BEHIND the glass modal */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/15 via-slate-900/60 to-sky-500/15 pointer-events-none" />
        
        {/* Top Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800/80 bg-gradient-to-b from-slate-800/40 to-transparent">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <EllixConnectLogo variant="symbol" size={40} alt="Ellic" />
            <div>
              <div className="flex items-center gap-2">
                <EllixConnectLogo variant="text" size={24} />
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-extrabold border border-sky-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Auth
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Unified Authentication • Google • Phone OTP • Email & Password
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs or 2FA Header */}
          {mode === 'mfa_totp' ? (
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border border-sky-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Two-Factor Authentication</span>
                  <span className="text-[11px] text-slate-400">TOTP Security Enforcement</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
                Challenge
              </span>
            </div>
          ) : (
            <div className="mt-4 flex items-center p-1 bg-slate-950/70 rounded-xl border border-slate-800/80">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Sign In</span>
              </button>

              <button
                onClick={() => {
                  setMode('phone');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'phone'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone OTP</span>
              </button>

              <button
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Notification / Error / Success Banners */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* 1-Click Google Sign In (Universal Top Option) */}
          {mode !== 'forgot_password' && mode !== 'mfa_totp' && (
            <div>
              <button
                id="btn-google-auth-login"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-white border border-slate-700/80 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google (Verified 1-Click)</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
                  <span className="bg-slate-900 px-3 tracking-wider">Or continue with email credentials</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: EMAIL SIGN IN */}
          {mode === 'login' && (
            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="input-login-email"
                    ref={loginEmailRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="merchant@retail.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Synchronized Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your synchronized password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* RBAC Security Policy Notice */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-slate-200 font-semibold">Enterprise RBAC Enforced:</strong> Account roles and module permissions are assigned exclusively by your organization's Administrator.
                </div>
              </div>

              <button
                id="btn-submit-email-login"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Ellic</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: PHONE NUMBER OTP VERIFICATION */}
          {mode === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Business Phone Number (SMS OTP Verification)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-2 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value="+91">🇮🇳 +91 (IN)</option>
                        <option value="+1">🇺🇸 +1 (US)</option>
                        <option value="+44">🇬🇧 +44 (UK)</option>
                        <option value="+971">🇦🇪 +971 (UAE)</option>
                        <option value="+65">🇸🇬 +65 (SG)</option>
                        <option value="+61">🇦🇺 +61 (AU)</option>
                      </select>

                      <div className="relative flex-1">
                        <Smartphone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          id="input-phone-number"
                          ref={phoneInputRef}
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          pattern="[0-9]*"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="9876543210"
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      We will send a 6-digit one-time verification code via SMS to verify this mobile number.
                    </p>
                  </div>

                  {/* Recaptcha container target */}
                  <div id="recaptcha-verifier-element" className="flex justify-center my-1"></div>

                  <button
                    id="btn-send-phone-otp"
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Send 6-Digit SMS OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Enter 6-Digit SMS Verification Code</h3>
                    <p className="text-xs text-slate-400">
                      Sent to <span className="text-sky-400 font-semibold">{countryCode} {phoneNumber}</span>
                    </p>
                  </div>

                  {/* 6 Digit OTP Inputs */}
                  <div className="flex justify-center gap-2">
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`input-otp-digit-${idx}`}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={idx === 0 ? 'one-time-code' : undefined}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center text-lg font-bold bg-slate-950 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Didn't receive SMS?</span>
                    {resendTimer > 0 ? (
                      <span className="text-slate-500 font-mono">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendPhoneOtp()}
                        className="text-sky-400 hover:underline font-semibold"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  <button
                    id="btn-verify-otp-submit"
                    type="submit"
                    disabled={loading || otpCode.join('').length !== 6}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Verify Phone & Sign In</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode(['', '', '', '', '', '']);
                    }}
                    className="w-full text-center text-xs text-slate-400 hover:text-white"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: CREATE ACCOUNT WITH SYNCHRONIZED PASSWORD */}
          {mode === 'register' && (
            <form onSubmit={handleEmailRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Owner / Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="input-register-name"
                    ref={registerNameRef}
                    type="text"
                    inputMode="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-slate-200 font-semibold">Role-Based Access Control:</strong> New merchant accounts are provisioned with standard access. Role assignments (Wholesaler, Manager, Cashier, Admin) are granted strictly by your organization's Administrator.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (Verification will be sent)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="input-register-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="owner@store.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Synchronized Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="input-register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="input-register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  This password will be <strong className="text-sky-300">synchronized</strong> across all your future linked providers (Google, Phone Number, and Email).
                </span>
              </div>

              <label className="flex items-start gap-2.5 pt-1 text-[11px] text-slate-400 cursor-pointer">
                <input
                  id="checkbox-register-legal-consent"
                  type="checkbox"
                  required
                  checked={acceptedLegalTerms}
                  onChange={(e) => setAcceptedLegalTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-blue-500 shrink-0"
                />
                <span className="leading-relaxed">
                  I agree to the {LEGAL_CONFIG.brandName}{' '}
                  <a
                    href="/terms-of-service"
                    onClick={(e) => {
                      e.preventDefault();
                      closeAuthModal();
                      window.history.pushState({}, '', '/terms-of-service');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="text-sky-400 font-semibold hover:underline"
                  >
                    Terms of Service
                  </a>{' '}
                  and consent to personal data processing under the{' '}
                  <a
                    href="/privacy-policy"
                    onClick={(e) => {
                      e.preventDefault();
                      closeAuthModal();
                      window.history.pushState({}, '', '/privacy-policy');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="text-sky-400 font-semibold hover:underline"
                  >
                    Privacy Policy
                  </a>.
                </span>
              </label>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={loading || !acceptedLegalTerms}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Synchronized Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 4: FORGOT PASSWORD */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Reset Synchronized Password</h3>
                <p className="text-xs text-slate-400">
                  Enter your registered email address and we'll send you a secure link to update your synchronized password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="input-reset-email"
                    ref={forgotEmailRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@retail.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                id="btn-send-password-reset"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Email</span>
                    <Mail className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* TAB 5: TOTP TWO-FACTOR AUTHENTICATION CHALLENGE */}
          {mode === 'mfa_totp' && (
            <form onSubmit={handleVerifyTotpSubmit} className="space-y-4">
              <div className="text-center space-y-1.5 py-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/30 border border-sky-500/40 flex items-center justify-center mx-auto text-sky-400 shadow-lg shadow-sky-500/10">
                  <Lock className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                    <span>Two-Factor Authentication</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-extrabold border border-sky-500/30">
                      TOTP
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Account protected with Two-Factor Authentication. Enter the 6-digit code from your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.).
                  </p>
                </div>
              </div>

              {/* 6 Digit TOTP Inputs */}
              <div className="flex justify-center gap-2 py-2">
                {totpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`input-totp-digit-${idx}`}
                    ref={(el) => (totpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={idx === 0 ? 'one-time-code' : undefined}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleTotpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleTotpKeyDown(idx, e)}
                    aria-label={`Authenticator code digit ${idx + 1} of 6`}
                    className="w-11 h-12 text-center text-xl font-mono font-bold bg-slate-950 border border-sky-500/40 rounded-xl text-white focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner"
                  />
                ))}
              </div>

              <button
                id="btn-verify-totp-submit"
                type="submit"
                disabled={loading || totpDigits.join('').length !== 6}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Complete Sign In</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelTotp}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel and return to Sign In
              </button>
            </form>
          )}

        </div>

        {/* Bottom Assurance Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Verified Firebase Authentication
          </span>
          <span className="text-slate-400">
            TLS 1.3 • AES-256
          </span>
        </div>

      </div>
    </div>
  );
};
