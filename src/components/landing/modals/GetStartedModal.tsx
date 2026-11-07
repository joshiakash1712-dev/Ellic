import React, { useState, useEffect } from 'react';
import { MarketingModal } from './MarketingModal';
import { EllixConnectLogo } from '../../branding/EllixConnectLogo';
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Phone,
  User,
  Mail,
  Plus,
  Trash2,
  Building2,
  Users,
  Compass,
  Loader2,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  LEGAL_CONFIG,
  LegalPageSlug,
  recordConsentAudit,
} from '../../../config/legal.config';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn?: () => void;
  onOpenLegalPage?: (slug: LegalPageSlug) => void;
}

interface CrewMemberInput {
  id: string;
  name: string;
  contact: string;
  role: 'cashier' | 'manager' | 'inventory';
}

const SHOP_TYPES = [
  'Grocery & Supermarket',
  'Electronics & Mobile',
  'Clothing & Apparel',
  'Hardware & Electrical',
  'General Retail & Mart',
  'Wholesaler & Distributor',
] as const;

export const GetStartedModal: React.FC<GetStartedModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignIn,
  onOpenLegalPage,
}) => {
  const { currentUser, loginWithGoogle } = useAuth();

  // Multi-stage flow: 1: Identity & Account, 2: Business Need & Shop Type, 3: Store & Team Setup
  const [stage, setStage] = useState<1 | 2 | 3>(currentUser ? 2 : 1);

  // Stage 1: Identity
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // 10 digits without +91
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Stage 2: Business Need & Shop Type
  const [businessNeed, setBusinessNeed] = useState<
    'retail' | 'wholesaler' | 'wholesaler_retailer' | 'exploring' | ''
  >('');
  const [shopType, setShopType] = useState<string>(''); // Placeholder by default, NOT pre-selected
  const [exploringTarget, setExploringTarget] = useState<'self' | 'clients' | ''>('');

  // Stage 3: Store, Location, Crew & Multi-Shop
  const [storeName, setStoreName] = useState('');
  const [city, setCity] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [crewMembers, setCrewMembers] = useState<CrewMemberInput[]>([]);
  const [isMultiStore, setIsMultiStore] = useState(false);
  const [multiStoreBranches, setMultiStoreBranches] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Automatically sync with logged in user
  useEffect(() => {
    if (currentUser) {
      if (currentUser.displayName && !fullName) {
        setFullName(currentUser.displayName);
      }
      if (currentUser.email && !email) {
        setEmail(currentUser.email);
      }
      if (currentUser.phoneNumber && !phone) {
        // Strip country code if present
        const cleaned = currentUser.phoneNumber.replace('+91', '').replace(/\D/g, '').slice(0, 10);
        if (cleaned) setPhone(cleaned);
      }
      // If user logs in while on stage 1, advance automatically to stage 2
      if (stage === 1) {
        setStage(2);
      }
    }
  }, [currentUser, stage]);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleError(null);
    setIsGoogleSigningIn(true);
    try {
      await loginWithGoogle();
      setStage(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign in failed. Please try again or fill in the details below.';
      setGoogleError(message);
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Location Auto-Detection
  const handleAutoDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please type your city manually.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const cityFound =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.suburb ||
              data.address?.county ||
              data.address?.state_district;
            const stateFound = data.address?.state;
            const detectedStr = [cityFound, stateFound].filter(Boolean).join(', ');
            if (detectedStr) {
              setCity(detectedStr);
            } else if (data.display_name) {
              const parts = data.display_name.split(',');
              setCity(parts.slice(0, 2).join(',').trim());
            }
          } else {
            setCity('Pune, Maharashtra');
          }
        } catch {
          setLocationError('Could not resolve location address. Please enter your city manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please enter your city manually.');
        } else {
          setLocationError('Location detection timed out. Please enter your city manually.');
        }
      },
      { timeout: 9000, enableHighAccuracy: false }
    );
  };

  // Crew helpers
  const handleAddCrew = () => {
    const newMember: CrewMemberInput = {
      id: `crew-${Date.now()}`,
      name: '',
      contact: '',
      role: 'cashier',
    };
    setCrewMembers([...crewMembers, newMember]);
  };

  const handleUpdateCrew = (
    id: string,
    field: keyof CrewMemberInput,
    value: string
  ) => {
    setCrewMembers(
      crewMembers.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      )
    );
  };

  const handleRemoveCrew = (id: string) => {
    setCrewMembers(crewMembers.filter((member) => member.id !== id));
  };

  // Validation handlers
  const handleProceedToStage2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);
    if (!fullName.trim()) {
      setStepError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStepError('Please enter a valid email address.');
      return;
    }
    if (!phone || phone.length !== 10) {
      setStepError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setStage(2);
  };

  const handleProceedToStage3 = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);
    if (!businessNeed) {
      setStepError('Please select your business need.');
      return;
    }
    if (businessNeed !== 'exploring' && !shopType) {
      setStepError('Please select your shop type from the dropdown.');
      return;
    }
    if (businessNeed === 'exploring' && !exploringTarget) {
      setStepError('Please indicate who you are exploring Ellic for.');
      return;
    }
    setStage(3);
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    if (!storeName.trim()) {
      setStepError('Please enter your store or business name.');
      return;
    }
    if (!city.trim()) {
      setStepError('Please enter or auto-detect your city/location.');
      return;
    }
    if (!consentAccepted) {
      setStepError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Record DPDPA compliance audit log
      recordConsentAudit({
        context: 'onboarding_inquiry',
        subjectIdentifier: `+91 ${phone.trim()}`,
        purposeSummary: `Merchant onboarding inquiry for ${storeName.trim()} (${businessNeed}: ${shopType || exploringTarget}) in ${city.trim()}`,
      });

      // 2. If logged in, update Firestore user profile
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            onboardingInquiry: {
              storeName: storeName.trim(),
              businessNeed,
              shopType: shopType || null,
              exploringTarget: exploringTarget || null,
              city: city.trim(),
              phone: `+91 ${phone.trim()}`,
              crewMembers: crewMembers.filter((c) => c.name.trim()),
              isMultiStore,
              multiStoreBranches: isMultiStore ? multiStoreBranches.trim() : null,
              submittedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('[GetStartedModal] Could not update Firestore user document:', dbErr);
        }
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setStepError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setConsentAccepted(false);
    setStage(currentUser ? 2 : 1);
    onClose();
  };

  const getBusinessNeedLabel = () => {
    switch (businessNeed) {
      case 'retail':
        return 'Retail Store';
      case 'wholesaler':
        return 'Wholesaler';
      case 'wholesaler_retailer':
        return 'Wholesaler & Retailer';
      case 'exploring':
        return 'Exploring';
      default:
        return 'Retail';
    }
  };

  return (
    <MarketingModal
      isOpen={isOpen}
      onClose={onClose}
      title="Get Started with Ellic"
      subtitle="Tailored for retail stores, supermarkets, and wholesalers in India (excluding restaurants)."
      maxWidth="max-w-xl"
    >
      {submitted ? (
        /* ================= SUCCESS COMPLETION STATE ================= */
        <div className="py-6 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Onboarding Profile Initialized
            </span>
            <h4 className="text-2xl font-black text-slate-950 dark:text-white">
              Welcome aboard, {fullName || 'Store Owner'}!
            </h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Your onboarding request for{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {storeName || 'your business'}
              </span>{' '}
              has been recorded in the platform registry.
            </p>
          </div>

          {/* Submission Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2.5 max-w-md mx-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Business Need:</span>
              <span className="font-bold text-slate-900 dark:text-white">{getBusinessNeedLabel()}</span>
            </div>
            {shopType && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Shop Type:</span>
                <span className="font-bold text-slate-900 dark:text-white">{shopType}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Location:</span>
              <span className="font-bold text-slate-900 dark:text-white">{city}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">WhatsApp / Phone:</span>
              <span className="font-bold text-slate-900 dark:text-white">+91 {phone}</span>
            </div>
            {crewMembers.filter((c) => c.name.trim()).length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Crew Members:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {crewMembers.filter((c) => c.name.trim()).length} member(s) listed
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Our onboarding team will contact you on WhatsApp to configure your barcode catalog, hardware printers, and assign user permissions.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-md"
            >
              Back to Website
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Brand Logo & Context Banner */}
          <div className="flex items-center justify-between pb-1">
            <EllixConnectLogo size="sm" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              India Edition (GST Ready)
            </span>
          </div>

          {/* 3-Stage Progress Indicator */}
          <div className="flex items-center justify-between px-1 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Step 1 */}
            <div className="flex items-center gap-2 pl-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  stage === 1
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                    : stage > 1
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {stage > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span
                className={`text-xs font-semibold ${
                  stage === 1
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Identity
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-3 transition-colors ${
                stage > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  stage === 2
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                    : stage > 2
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {stage > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span
                className={`text-xs font-semibold ${
                  stage === 2
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Business Need
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-3 transition-colors ${
                stage > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />

            {/* Step 3 */}
            <div className="flex items-center gap-2 pr-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  stage === 3
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                3
              </div>
              <span
                className={`text-xs font-semibold ${
                  stage === 3
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Store &amp; Team
              </span>
            </div>
          </div>

          {/* Validation Error Banner */}
          {stepError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {stepError}
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 1: ACCOUNT & IDENTITY (Skipped if already signed in)    */}
          {/* ============================================================== */}
          {stage === 1 && (
            <div className="space-y-4">
              {/* Google Sign-in Option */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSigningIn}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-sm disabled:opacity-60"
                >
                  {isGoogleSigningIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Connecting with Google...</span>
                    </>
                  ) : (
                    <>
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
                      <span>Continue with Google (Auto-sync Gmail)</span>
                    </>
                  )}
                </button>
                {googleError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">{googleError}</p>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  Recommended for direct admin role assignment &amp; single sign-on.
                </p>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  or enter profile details
                </span>
              </div>

              {/* Identity Form */}
              <form onSubmit={handleProceedToStage2} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp / Phone Number *
                  </label>
                  <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                    <span className="inline-flex items-center px-3 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm border-r border-slate-200 dark:border-slate-700 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="98765 43210"
                      className="w-full px-3 py-2 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    Enter only your 10-digit Indian mobile number (+91 is pre-fixed).
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue to Business Need</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 2: BUSINESS NEED & SHOP TYPE                            */}
          {/* ============================================================== */}
          {stage === 2 && (
            <form onSubmit={handleProceedToStage3} className="space-y-4">
              {currentUser && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Signed in as <strong>{currentUser.displayName || currentUser.email}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                    Verified
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  What best describes your business need? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Retail */}
                  <label
                    onClick={() => {
                      setBusinessNeed('retail');
                      setStepError(null);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      businessNeed === 'retail'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Retail
                      </span>
                      <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Counter POS, barcode billing, and fast customer checkout.
                    </p>
                  </label>

                  {/* Wholesaler */}
                  <label
                    onClick={() => {
                      setBusinessNeed('wholesaler');
                      setStepError(null);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      businessNeed === 'wholesaler'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Wholesaler
                      </span>
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Bulk orders, customer khata credit, and multi-tier pricing.
                    </p>
                  </label>

                  {/* Wholesaler & Retailer */}
                  <label
                    onClick={() => {
                      setBusinessNeed('wholesaler_retailer');
                      setStepError(null);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      businessNeed === 'wholesaler_retailer'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Wholesaler &amp; Retailer
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Hybrid model: retail walk-ins + B2B distributor deliveries.
                    </p>
                  </label>

                  {/* Just Exploring */}
                  <label
                    onClick={() => {
                      setBusinessNeed('exploring');
                      setShopType('');
                      setStepError(null);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      businessNeed === 'exploring'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Just Exploring
                      </span>
                      <Compass className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      Testing features, learning POS tech, or evaluating for clients.
                    </p>
                  </label>
                </div>
              </div>

              {/* Fixed Layout Conditional Area: Swaps info according to selected type without changing layout */}
              <div className="min-h-[105px] flex flex-col justify-center transition-all duration-200">
                {/* Conditional 1: If Retail, Wholesaler, or Wholesaler & Retailer -> Shop Type Dropdown */}
                {businessNeed && businessNeed !== 'exploring' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Your Shop Type / Category *
                    </label>
                    <select
                      required
                      value={shopType}
                      onChange={(e) => setShopType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="" disabled>
                        Select your shop type / category...
                      </option>
                      {SHOP_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      We tailor default GST tax rates, units, and inventory barcodes to your category.
                    </p>
                  </div>
                )}

                {/* Conditional 2: If Just Exploring -> Ask for whom */}
                {businessNeed === 'exploring' && (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Who are you exploring Ellic for? *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        onClick={() => setExploringTarget('self')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          exploringTarget === 'self'
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          For Myself
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Learning features or planning a future store.
                        </div>
                      </label>

                      <label
                        onClick={() => setExploringTarget('clients')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          exploringTarget === 'clients'
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          For Other Shop Owners
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Consultant, CA / accountant, or retail partner.
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Placeholder when no business need is selected yet */}
                {!businessNeed && (
                  <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <span>Select a business need above to configure category or exploring options</span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-2">
                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => setStage(1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue to Store &amp; Team Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STAGE 3: STORE, CREW, LOCATION & MULTI-SHOP                   */}
          {/* ============================================================== */}
          {stage === 3 && (
            <form onSubmit={handleSubmitFinal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Store Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store / Business Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Metro Mart"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* City / Location with Auto-detect button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      City / Location *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
                      disabled={isLocating}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span>Auto-detect</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune, Maharashtra"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  {locationError && (
                    <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                      {locationError}
                    </p>
                  )}
                </div>
              </div>

              {/* Add Crew / Staff Members */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Add Crew &amp; Staff (Optional)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Assign counter cashiers, store managers, or stock leads.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCrew}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Member</span>
                  </button>
                </div>

                {crewMembers.length > 0 && (
                  <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                    {crewMembers.map((member, index) => (
                      <div
                        key={member.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-center gap-2 text-xs"
                      >
                        <input
                          type="text"
                          placeholder={`Staff #${index + 1} Name`}
                          value={member.name}
                          onChange={(e) => handleUpdateCrew(member.id, 'name', e.target.value)}
                          className="w-full sm:w-1/3 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Phone / WhatsApp"
                          value={member.contact}
                          onChange={(e) => handleUpdateCrew(member.id, 'contact', e.target.value)}
                          className="w-full sm:w-1/3 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        />
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleUpdateCrew(
                              member.id,
                              'role',
                              e.target.value as CrewMemberInput['role']
                            )
                          }
                          className="w-full sm:w-1/4 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="cashier">Cashier</option>
                          <option value="manager">Manager</option>
                          <option value="inventory">Inventory Lead</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveCrew(member.id)}
                          aria-label="Remove crew member"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-Shop Toggle & Join */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Multiple Shops &amp; Branch Linking
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Operate or join multiple retail branches from one admin console.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMultiStore}
                    onChange={(e) => setIsMultiStore(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </label>

                {isMultiStore && (
                  <div className="pt-2">
                    <input
                      type="text"
                      value={multiStoreBranches}
                      onChange={(e) => setMultiStoreBranches(e.target.value)}
                      placeholder="e.g. Main Branch, Warehouse, Kothrud Branch"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      You can also link other existing Ellic store accounts after onboarding.
                    </p>
                  </div>
                )}
              </div>

              {/* DPDPA 2023 Affirmative Consent Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-emerald-600 shrink-0"
                />
                <span className="leading-relaxed">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenLegalPage) {
                        onClose();
                        onOpenLegalPage('terms-of-service');
                      }
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Terms of Service
                  </button>{' '}
                  and consent to the processing of my business and contact details for onboarding in accordance with the{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenLegalPage) {
                        onClose();
                        onOpenLegalPage('privacy-policy');
                      }
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Privacy Policy
                  </button>{' '}
                  (you may withdraw consent at any time via Data &amp; Privacy Rights).
                </span>
              </label>

              {/* Navigation & Submit */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStage(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={!consentAccepted || isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Setup...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup &amp; Request Access</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer note */}
          <div className="pt-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
            <span>Free 14-day trial included · No credit card required</span>
            {onSwitchToSignIn && (
              <span className="block mt-1">
                Already an onboarded client?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToSignIn();
                  }}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Sign In here
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </MarketingModal>
  );
};

