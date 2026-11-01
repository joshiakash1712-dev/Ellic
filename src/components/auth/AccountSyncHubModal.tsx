import React, { useState, useRef, useEffect } from 'react';
import { ConfirmationResult, TotpSecret } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { normalizeCanonicalRole } from '../../types';
import {
  LEGAL_CONFIG,
  getConsentAuditHistory,
  submitDataPrincipalRequest,
} from '../../config/legalConfig';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Lock,
  KeyRound,
  RefreshCw,
  Sparkles,
  Smartphone,
  ExternalLink,
  LogOut,
  UserCheck,
  Zap,
  Check,
  HelpCircle,
  Download,
  QrCode,
  Copy,
  ShieldAlert
} from 'lucide-react';

export const AccountSyncHubModal: React.FC = () => {
  const {
    currentUser,
    userProfile,
    isSyncHubOpen,
    setIsSyncHubOpen,
    isTotpEnrolled,
    startTotpEnrollment,
    confirmTotpEnrollment,
    unenrollTotp,
    linkGoogleAccount,
    linkEmailAndPassword,
    setUpPhoneRecaptcha,
    sendPhoneOtp,
    linkPhoneOtp,
    synchronizeMasterPassword,
    resendVerificationEmail,
    logout
  } = useAuth();

  // Dialog sub-modes for linking & MFA
  const [activeLinkingTarget, setActiveLinkingTarget] = useState<'none' | 'email' | 'phone' | 'password' | 'totp'>('none');

  // TOTP 2FA enrollment states
  const [totpSetupData, setTotpSetupData] = useState<{
    secretKey: string;
    qrCodeUrl: string;
    qrCodeDataUrl: string;
    totpSecret: TotpSecret;
  } | null>(null);
  const [totpEnrollDigits, setTotpEnrollDigits] = useState(['', '', '', '', '', '']);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const totpEnrollInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email linking states
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkConfirmPassword, setLinkConfirmPassword] = useState('');

  // Phone linking states
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // Synchronized master password state
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isSyncHubOpen) {
      setActiveLinkingTarget('none');
      setErrorMessage(null);
      setSuccessMessage(null);
      setTotpSetupData(null);
      setTotpEnrollDigits(['', '', '', '', '', '']);
      setCopiedSecret(false);
    }
  }, [isSyncHubOpen]);

  if (!isSyncHubOpen || !currentUser) return null;

  // Determine user role security requirements
  const canonicalRole = currentUser.email?.toLowerCase() === 'ellixorrr@gmail.com'
    ? 'super_admin'
    : normalizeCanonicalRole(userProfile?.role);
  const isHighSecurityTargetRole = canonicalRole === 'client' || canonicalRole === 'super_admin';

  // Determine linked providers from Firebase user.providerData and userProfile
  const linkedProviderIds = currentUser.providerData.map(p => p.providerId);
  const hasGoogle = linkedProviderIds.includes('google.com');
  const hasPassword = linkedProviderIds.includes('password');
  const hasPhone = linkedProviderIds.includes('phone') || Boolean(currentUser.phoneNumber);

  const isEmailVerified = currentUser.emailVerified || (hasGoogle && Boolean(currentUser.email));

  // 1. Link Google
  const handleLinkGoogle = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await linkGoogleAccount();
      setSuccessMessage('Google account successfully linked and synchronized!');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMessage(null);
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups or open in a new tab.');
      } else if (code === 'auth/credential-already-in-use') {
        setErrorMessage('This Google account is already associated with another login. Please use a different Google account or log in with that account.');
      } else {
        setErrorMessage(err?.message || 'Failed to link Google account.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Link Email & Password
  const handleLinkEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail || !linkPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    if (linkPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (linkPassword !== linkConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await linkEmailAndPassword(linkEmail, linkPassword);
      setSuccessMessage('Email & Password successfully linked! Your master password has been synchronized.');
      setActiveLinkingTarget('none');
      setLinkEmail('');
      setLinkPassword('');
      setLinkConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/credential-already-in-use') {
        setErrorMessage('This email is already associated with another account.');
      } else {
        setErrorMessage(err.message || 'Failed to link Email & Password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Link Phone Number OTP
  const handleSendLinkPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 7) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const verifier = setUpPhoneRecaptcha('link-phone-recaptcha');
      const cleanPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      const res = await sendPhoneOtp(cleanPhone, verifier);
      setConfirmationResult(res);
      setOtpSent(true);
      setSuccessMessage(`SMS OTP sent to ${cleanPhone}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch phone verification SMS.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLinkPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6 || !confirmationResult) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await linkPhoneOtp(confirmationResult, fullOtp);
      setSuccessMessage('Phone number verified & linked successfully!');
      setActiveLinkingTarget('none');
      setOtpSent(false);
      setPhoneNumber('');
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      if (err.code === 'auth/credential-already-in-use') {
        setErrorMessage('This phone number is already attached to another account.');
      } else {
        setErrorMessage(err.message || 'Failed to verify phone OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Synchronize Master Password
  const handleSynchronizeMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword || masterPassword.length < 6) {
      setErrorMessage('Master password must be at least 6 characters long.');
      return;
    }
    if (masterPassword !== confirmMasterPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await synchronizeMasterPassword(masterPassword);
      setSuccessMessage('Master password synchronized! You can now use this exact password across all linked credentials.');
      setMasterPassword('');
      setConfirmMasterPassword('');
      setActiveLinkingTarget('none');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setErrorMessage('For security, please log out and log in again before changing your synchronized password.');
      } else {
        setErrorMessage(err.message || 'Failed to update synchronized password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. Resend verification email
  const handleResendEmailVerification = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await resendVerificationEmail();
      setVerificationEmailSent(true);
      setSuccessMessage(`Verification link sent to ${currentUser.email}. Please click the link in your email inbox.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to dispatch verification email.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Start TOTP Two-Factor Authentication Setup
  const handleStartTotpEnrollment = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await startTotpEnrollment();
      setTotpSetupData(res);
      setTotpEnrollDigits(['', '', '', '', '', '']);
      setActiveLinkingTarget('totp');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initialize TOTP two-factor enrollment.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Verify & Confirm TOTP Enrollment
  const handleConfirmTotpEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = totpEnrollDigits.join('').trim();
    if (code.length !== 6 || !totpSetupData) {
      setErrorMessage('Please enter the complete 6-digit code from your authenticator app.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await confirmTotpEnrollment(totpSetupData.totpSecret, code);
      setSuccessMessage('TOTP Two-Factor Authentication has been successfully activated on your account!');
      setActiveLinkingTarget('none');
      setTotpSetupData(null);
      setTotpEnrollDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid 6-digit code. Please check your authenticator and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 8. Unenroll TOTP 2FA
  const handleUnenrollTotp = async () => {
    if (!window.confirm('Are you sure you want to disable TOTP Two-Factor Authentication? Account security will be reduced.')) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await unenrollTotp();
      setSuccessMessage('TOTP Two-Factor Authentication has been disabled for your account.');
      setActiveLinkingTarget('none');
      setTotpSetupData(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to disable TOTP Two-Factor Authentication.');
    } finally {
      setLoading(false);
    }
  };

  // 9. Copy secret key to clipboard
  const handleCopySecretKey = () => {
    if (!totpSetupData?.secretKey) return;
    navigator.clipboard.writeText(totpSetupData.secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  return (
    <div id="account-sync-hub-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Subtle brand gradient backdrop BEHIND the glass modal */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600/15 via-slate-900/60 to-sky-500/15 pointer-events-none" />
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Authentication & Credential Sync Hub
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold border border-sky-500/30">
                  Synchronized
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Google, Phone Number & Email linked with one synchronized master password
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSyncHubOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {/* Current User Snapshot */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-sky-500/40 object-cover shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600/30 border border-sky-500/40 flex items-center justify-center text-sky-300 font-bold text-lg">
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {currentUser.displayName || 'Authenticated Merchant'}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                    {userProfile?.role || 'Retailer'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                  <span>{currentUser.email || currentUser.phoneNumber || 'No email/phone assigned'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    UID: {currentUser.uid.slice(0, 10)}...
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout();
                setIsSyncHubOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/80 text-xs font-semibold flex items-center gap-1.5 transition-all self-end sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Verification Status Banner if Email is unverified */}
          {currentUser.email && !isEmailVerified && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-200">
                    Email Address Pending Verification
                  </div>
                  <div className="text-[11px] text-amber-300/80">
                    {currentUser.email} has not been verified yet. Click to verify your email.
                  </div>
                </div>
              </div>

              <button
                onClick={handleResendEmailVerification}
                disabled={loading || verificationEmailSent}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
              >
                {verificationEmailSent ? 'Link Sent!' : 'Send Verification Link'}
              </button>
            </div>
          )}

          {/* Section 1: Linked Providers Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Synchronized Login Methods</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                {linkedProviderIds.length} of 3 Linked
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* 1. GOOGLE */}
              <div className={`p-4 rounded-xl border transition-all ${
                hasGoogle
                  ? 'bg-slate-950/80 border-sky-500/30'
                  : 'bg-slate-950/40 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
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
                    <span className="text-xs font-bold text-white">Google</span>
                  </div>
                  {hasGoogle ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-500/20 text-sky-300 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold">Unlinked</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-3 min-h-[32px]">
                  {hasGoogle
                    ? '1-Click verified Google Sign-In active.'
                    : 'Link your Google account for 1-click instant sign-in.'}
                </p>

                {hasGoogle ? (
                  <div className="text-[11px] text-sky-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active & Verified</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLinkGoogle}
                    disabled={loading}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <span>Link Google</span>
                  </button>
                )}
              </div>

              {/* 2. EMAIL & PASSWORD */}
              <div className={`p-4 rounded-xl border transition-all ${
                hasPassword
                  ? 'bg-slate-950/80 border-sky-500/30'
                  : 'bg-slate-950/40 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Email & Pass</span>
                  </div>
                  {hasPassword ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-500/20 text-sky-300 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold">Unlinked</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-3 min-h-[32px]">
                  {hasPassword
                    ? `${currentUser.email || 'Email set'} with synchronized password.`
                    : 'Add email and synchronized password to log in directly.'}
                </p>

                {hasPassword ? (
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${
                      isEmailVerified ? 'text-sky-400' : 'text-amber-400'
                    }`}>
                      {isEmailVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{isEmailVerified ? 'Verified' : 'Unverified'}</span>
                    </span>
                    <button
                      onClick={() => setActiveLinkingTarget('password')}
                      className="text-[11px] text-sky-400 hover:underline font-semibold"
                    >
                      Update Pass
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveLinkingTarget('email')}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <span>Link Email & Pass</span>
                  </button>
                )}
              </div>

              {/* 3. PHONE NUMBER OTP */}
              <div className={`p-4 rounded-xl border transition-all ${
                hasPhone
                  ? 'bg-slate-950/80 border-sky-500/30'
                  : 'bg-slate-950/40 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Phone OTP</span>
                  </div>
                  {hasPhone ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-500/20 text-sky-300 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold">Unlinked</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-3 min-h-[32px]">
                  {hasPhone
                    ? `${currentUser.phoneNumber || 'Mobile number'} verified via SMS.`
                    : 'Link mobile number to log in securely with SMS OTP.'}
                </p>

                {hasPhone ? (
                  <div className="text-[11px] text-sky-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SMS Verified</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveLinkingTarget('phone')}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <span>Link Phone OTP</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Section 1.5: Two-Factor Authentication (TOTP Authenticator) Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isTotpEnrolled
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : isHighSecurityTargetRole
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white">
                      Two-Factor Authentication (TOTP Authenticator)
                    </h4>
                    {isHighSecurityTargetRole && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-sky-400 border border-sky-500/30">
                        {canonicalRole === 'super_admin' ? 'Super Admin Priority' : 'Client / Store Owner Priority'}
                      </span>
                    )}
                    {isTotpEnrolled ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active & Enforced
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Not Enrolled
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Requires a 6-digit verification code from Google Authenticator, Microsoft Authenticator, or 1Password when signing in.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {isTotpEnrolled ? (
                  <button
                    onClick={handleUnenrollTotp}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>Disable 2FA</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartTotpEnrollment}
                    disabled={loading}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Set Up Authenticator App</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Inline Dialogs for Linking */}
          
          {/* LINK EMAIL & PASSWORD SUB-FORM */}
          {activeLinkingTarget === 'email' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span>Link Email & Set Synchronized Password</span>
                </h4>
                <button
                  onClick={() => setActiveLinkingTarget('none')}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleLinkEmailPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Synchronized Password</label>
                    <input
                      type="password"
                      required
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={linkConfirmPassword}
                      onChange={(e) => setLinkConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Link Email with Password'}
                </button>
              </form>
            </div>
          )}

          {/* LINK PHONE NUMBER WITH OTP SUB-FORM */}
          {activeLinkingTarget === 'phone' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Link Mobile Number via SMS OTP</span>
                </h4>
                <button
                  onClick={() => {
                    setActiveLinkingTarget('none');
                    setOtpSent(false);
                  }}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendLinkPhoneOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9876543210"
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div id="link-phone-recaptcha" className="flex justify-center my-1"></div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Send Verification Code via SMS'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmLinkPhoneOtp} className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Enter the 6-digit code sent to <strong className="text-sky-400">{countryCode} {phoneNumber}</strong>:
                  </p>

                  <div className="flex justify-center gap-2">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpInputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(-1);
                          const updated = [...otpDigits];
                          updated[i] = val;
                          setOtpDigits(updated);
                          if (val && i < 5) otpInputRefs.current[i + 1]?.focus();
                        }}
                        className="w-10 h-10 text-center font-bold text-base bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpDigits.join('').length !== 6}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify Code & Link Phone'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TOTP 2FA ENROLLMENT WIZARD SUB-FORM */}
          {activeLinkingTarget === 'totp' && totpSetupData && (
            <div className="p-5 rounded-xl bg-slate-950 border border-sky-500/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Set Up TOTP Two-Factor Authenticator
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Scan the QR code or enter the key in your authenticator app
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveLinkingTarget('none');
                    setTotpSetupData(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                  <div className="p-2 bg-white rounded-xl shadow-lg mb-2">
                    <img
                      src={totpSetupData.qrCodeDataUrl}
                      alt="TOTP Enrollment QR Code"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Scan with Google Authenticator, Microsoft Authenticator, or 1Password
                  </span>
                </div>

                {/* Secret Key & Instructions */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Can't scan? Enter this secret key manually:
                    </label>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300 select-all break-all">
                      <span className="flex-1 tracking-wider">{totpSetupData.secretKey}</span>
                      <button
                        type="button"
                        onClick={handleCopySecretKey}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-semibold shrink-0 flex items-center gap-1 transition-colors"
                        title="Copy Secret Key"
                      >
                        {copiedSecret ? (
                          <>
                            <Check className="w-3 h-3 text-sky-400" />
                            <span className="text-sky-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="font-semibold text-slate-300">Account identifier:</div>
                    <div className="text-slate-400 truncate">{currentUser.email || currentUser.displayName || 'Ellic Account'}</div>
                  </div>
                </div>
              </div>

              {/* Step 2: Verification Code Input */}
              <form onSubmit={handleConfirmTotpEnrollment} className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-center sm:text-left">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Enter the 6-digit verification code from your authenticator:
                  </label>
                  <p className="text-[11px] text-slate-400">
                    This confirms your authenticator is synchronized and functioning properly.
                  </p>
                </div>

                <div className="flex justify-center gap-2 py-1">
                  {totpEnrollDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (totpEnrollInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(-1);
                        const next = [...totpEnrollDigits];
                        next[idx] = val;
                        setTotpEnrollDigits(next);
                        if (val && idx < 5) {
                          totpEnrollInputRefs.current[idx + 1]?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !totpEnrollDigits[idx] && idx > 0) {
                          totpEnrollInputRefs.current[idx - 1]?.focus();
                        }
                      }}
                      aria-label={`Verification code digit ${idx + 1} of 6`}
                      className="w-10 h-11 text-center font-bold text-lg bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLinkingTarget('none');
                      setTotpSetupData(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || totpEnrollDigits.join('').length !== 6}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Verify & Activate 2FA</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 3: Master Password Synchronization Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Synchronized Master Password
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Use the same password to sign in with your email or access your synchronized account.
                  </p>
                </div>
              </div>

              {activeLinkingTarget !== 'password' && (
                <button
                  onClick={() => setActiveLinkingTarget('password')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300 border border-slate-700 transition-colors shrink-0"
                >
                  Set / Change Password
                </button>
              )}
            </div>

            {activeLinkingTarget === 'password' && (
              <form onSubmit={handleSynchronizeMasterPassword} className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      New Synchronized Password
                    </label>
                    <input
                      type="password"
                      required
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmMasterPassword}
                      onChange={(e) => setConfirmMasterPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveLinkingTarget('none')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Synchronize Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Educational Security Note */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>How Identity Synchronization Works:</span>
            </div>
            <p className="leading-relaxed">
              When Google, Phone Number, and Email/Password are linked, they share the exact same user account, permissions, and data in Ellic. Setting a synchronized password enables you to sign in with your email address using that same password at any time.
            </p>
          </div>

          {/* Section 4: Data Principal Rights & Account Privacy Controls (DPDPA 2023) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-400" />
                  <span>Data &amp; Privacy Rights (DPDPA, 2023)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Export your account profile summary or submit a formal erasure / consent withdrawal request.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const summary = {
                      platform: LEGAL_CONFIG.brandName,
                      exportedAt: new Date().toISOString(),
                      accountProfile: {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName || userProfile?.displayName,
                        email: currentUser.email,
                        emailVerified: currentUser.emailVerified,
                        phoneNumber: currentUser.phoneNumber,
                        role: userProfile?.role,
                        linkedProviders: currentUser.providerData.map((p) => p.providerId),
                      },
                      consentAuditRecords: getConsentAuditHistory(),
                    };
                    const blob = new Blob([JSON.stringify(summary, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ellic-account-privacy-summary-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setSuccessMessage('Account & privacy data summary downloaded as JSON.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Export My Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const req = submitDataPrincipalRequest({
                      requestType: 'erasure_deletion',
                      requesterName: currentUser.displayName || userProfile?.displayName || 'Authenticated User',
                      requesterEmailOrPhone: currentUser.email || currentUser.phoneNumber || currentUser.uid,
                      accountRole: userProfile?.role || 'retailer',
                      details: 'Authenticated user requested account erasure / consent withdrawal via Account Sync Hub.',
                    });
                    setSuccessMessage(
                      `Account erasure / consent withdrawal request logged (Ref: ${req.id}). Our privacy officer will process this in accordance with DPDPA 2023.`
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-colors"
                >
                  Request Account Deletion
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            Security Rules Verified Active
          </span>
          <button
            onClick={() => setIsSyncHubOpen(false)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
