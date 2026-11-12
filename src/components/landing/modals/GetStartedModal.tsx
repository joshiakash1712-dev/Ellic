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
  initialPlanId?: string | null;
}

const PLAN_NAMES: Record<string, string> = {
  trial: '14-Day Free Trial (₹0)',
  starter: 'Retail Starter (₹749/mo)',
  growth: 'Supermarket & Growth Pro (₹1,875/mo)',
  enterprise: 'Wholesaler & Multi-Store (₹3,749/mo)',
};

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
  initialPlanId,
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
  const [shopType, setShopType] = useState<string>('');
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
        const cleaned = currentUser.phoneNumber.replace('+91', '').replace(/\D/g, '').slice(0, 10);
        if (cleaned) setPhone(cleaned);
      }
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
      const message =
        err instanceof Error
          ? err.message
          : 'Google sign-in could not be completed. Please try again or enter details below.';
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
        <div className="py-4 sm:py-6 text-center space-y-4 sm:space-y-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Onboarding Profile Initialized
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
              Welcome aboard, {fullName || 'Store Owner'}!
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Your onboarding request for{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {storeName || 'your business'}
              </span>{' '}
              has been recorded in the platform registry.
            </p>
          </div>

          {/* Submission Summary Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Business Need:</span>
              <span className="font-bold text-slate-900 dark:text-white">{getBusinessNeedLabel()}</span>
            </div>
            {shopType && (
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Shop Type:</span>
                <span className="font-bold text-slate-900 dark:text-white">{shopType}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Location:</span>
              <span className="font-bold text-slate-900 dark:text-white">{city}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-700">
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

          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Our onboarding team will contact you on WhatsApp to configure your barcode catalog, hardware printers, and assign user permissions.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-8 h-11 sm:h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md inline-flex items-center justify-center"
            >
              Back to Website
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5 sm:space-y-4">
          {/* Brand Logo & Context Banner */}
          <div className="flex items-center justify-between gap-2 pb-0.5">
            <EllixConnectLogo size="sm" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              India Edition (GST Ready)
            </span>
          </div>

          {/* Selected Plan Banner */}
          {initialPlanId && PLAN_NAMES[initialPlanId] && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-sky-300">
              <span className="font-semibold">Plan Selected: <span className="font-bold">{PLAN_NAMES[initialPlanId]}</span></span>
              <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">14-Day Free Trial</span>
            </div>
          )}

          {/* Responsive 3-Stage Progress Indicator */}
          <div className="p-1 sm:p-1.5 bg-slate-100/80 dark:bg-slate-800/70 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            {/* Desktop / Tablet Stepper (Horizontal with full step labels) */}
            <div className="hidden sm:flex items-center justify-between px-2 py-1">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    stage === 1
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                      : stage > 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {stage > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <span
                  className={`text-xs ${
                    stage === 1
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400 font-medium'
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
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    stage === 2
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                      : stage > 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {stage > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                </div>
                <span
                  className={`text-xs ${
                    stage === 2
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400 font-medium'
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
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    stage === 3
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-xs ${
                    stage === 3
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400 font-medium'
                  }`}
                >
                  Store &amp; Team
                </span>
              </div>
            </div>

            {/* Mobile Stepper (< 640px): Compact horizontal track with prominent active pill & zero wrapping */}
            <div className="sm:hidden flex items-center justify-between gap-1.5 px-1 py-0.5">
              {/* Step 1 Pill/Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                  stage === 1
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    stage === 1
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : stage > 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {stage > 1 ? <Check className="w-3 h-3" /> : '1'}
                </div>
                <span className="text-[11px] font-bold">
                  {stage === 1 ? 'Identity' : '1'}
                </span>
              </div>

              <div
                className={`flex-1 h-0.5 transition-colors ${
                  stage > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />

              {/* Step 2 Pill/Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                  stage === 2
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    stage === 2
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : stage > 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {stage > 2 ? <Check className="w-3 h-3" /> : '2'}
                </div>
                <span className="text-[11px] font-bold">
                  {stage === 2 ? 'Business' : '2'}
                </span>
              </div>

              <div
                className={`flex-1 h-0.5 transition-colors ${
                  stage > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />

              {/* Step 3 Pill/Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                  stage === 3
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    stage === 3
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  3
                </div>
                <span className="text-[11px] font-bold">
                  {stage === 3 ? 'Store' : '3'}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Error Banner */}
          {stepError && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
              <span className="font-bold">•</span>
              <span className="flex-1">{stepError}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 1: ACCOUNT & IDENTITY (Skipped if already signed in)    */}
          {/* ============================================================== */}
          {stage === 1 && (
            <div className="space-y-3.5 sm:space-y-4">
              {/* Google Sign-in Option */}
              <div className="space-y-1.5 sm:space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSigningIn}
                  className="w-full min-h-[44px] sm:min-h-[48px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 sm:gap-3 transition-all shadow-xs hover:shadow active:scale-[0.99] disabled:opacity-60"
                >
                  {isGoogleSigningIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
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
                      <span className="truncate">Continue with Google (Auto-sync Gmail)</span>
                    </>
                  )}
                </button>
                {googleError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">{googleError}</p>
                )}
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 text-center leading-normal">
                  Recommended for direct admin role assignment &amp; single sign-on.
                </p>
              </div>

              {/* Symmetrical Alternative Divider */}
              <div className="relative flex items-center my-2 sm:my-3">
                <div className="grow border-t border-slate-200 dark:border-slate-700/80" />
                <span className="shrink-0 px-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                  or enter profile details
                </span>
                <div className="grow border-t border-slate-200 dark:border-slate-700/80" />
              </div>

              {/* Identity Form */}
              <form onSubmit={handleProceedToStage2} className="space-y-3 sm:space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-emerald-600 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      autoCapitalize="words"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-emerald-600 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      inputMode="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp / Phone Number <span className="text-emerald-600 dark:text-emerald-400">*</span>
                  </label>
                  <div className="flex h-11 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-2xs">
                    <span className="inline-flex items-center gap-1.5 px-3 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm border-r border-slate-200 dark:border-slate-700/80 select-none shrink-0">
                      <span className="text-sm leading-none">🇮🇳</span>
                      <span>+91</span>
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      autoComplete="tel-national"
                      maxLength={10}
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="98765 43210"
                      className="w-full px-3.5 bg-transparent text-xs sm:text-sm focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                  <p className="mt-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    Enter only your 10-digit Indian mobile number (+91 is pre-fixed).
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 h-11 sm:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Continue to Business Need</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 2: BUSINESS NEED & SHOP TYPE                            */}
          {/* ============================================================== */}
          {stage === 2 && (
            <form onSubmit={handleProceedToStage3} className="space-y-3.5 sm:space-y-4">
              {currentUser && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate">
                      Signed in as <strong>{currentUser.displayName || currentUser.email}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                    Verified
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                  What best describes your business need? <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-2.5">
                  {/* Retail */}
                  <label
                    onClick={() => {
                      setBusinessNeed('retail');
                      setStepError(null);
                    }}
                    className={`min-h-[74px] sm:min-h-[82px] p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      businessNeed === 'retail'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Retail
                      </span>
                      <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Counter POS, barcode billing, and fast customer checkout.
                    </p>
                  </label>

                  {/* Wholesaler */}
                  <label
                    onClick={() => {
                      setBusinessNeed('wholesaler');
                      setStepError(null);
                    }}
                    className={`min-h-[74px] sm:min-h-[82px] p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      businessNeed === 'wholesaler'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Wholesaler
                      </span>
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Bulk orders, customer khata credit, and multi-tier pricing.
                    </p>
                  </label>

                  {/* Wholesaler & Retailer */}
                  <label
                    onClick={() => {
                      setBusinessNeed('wholesaler_retailer');
                      setStepError(null);
                    }}
                    className={`min-h-[74px] sm:min-h-[82px] p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      businessNeed === 'wholesaler_retailer'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Wholesaler &amp; Retailer
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
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
                    className={`min-h-[74px] sm:min-h-[82px] p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      businessNeed === 'exploring'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Just Exploring
                      </span>
                      <Compass className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Testing features, learning POS tech, or evaluating for clients.
                    </p>
                  </label>
                </div>
              </div>

              {/* Conditional Area */}
              <div className="min-h-[84px] flex flex-col justify-center transition-all duration-200">
                {businessNeed && businessNeed !== 'exploring' && (
                  <div className="space-y-1 animate-in fade-in">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Your Shop Type / Category <span className="text-emerald-600 dark:text-emerald-400">*</span>
                    </label>
                    <select
                      required
                      value={shopType}
                      onChange={(e) => setShopType(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white font-medium"
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
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                      We tailor default GST tax rates, units, and inventory barcodes to your category.
                    </p>
                  </div>
                )}

                {businessNeed === 'exploring' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Who are you exploring Ellic for? <span className="text-emerald-600 dark:text-emerald-400">*</span>
                    </label>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      <label
                        onClick={() => setExploringTarget('self')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          exploringTarget === 'self'
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300'
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
                            : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300'
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

                {!businessNeed && (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Select a business need above to configure category or exploring options</span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2 sm:gap-3 pt-1">
                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => setStage(1)}
                    className="h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 h-11 sm:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <span className="truncate">Continue to Store &amp; Team Setup</span>
                  <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STAGE 3: STORE, CREW, LOCATION & MULTI-SHOP                   */}
          {/* ============================================================== */}
          {stage === 3 && (
            <form onSubmit={handleSubmitFinal} className="space-y-3.5 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Store Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store / Business Name <span className="text-emerald-600 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Metro Mart"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* City / Location with Auto-detect button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      City / Location <span className="text-emerald-600 dark:text-emerald-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
                      disabled={isLocating}
                      className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 disabled:opacity-50"
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
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune, Maharashtra"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-2xs"
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
              <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        Add Crew &amp; Staff (Optional)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        Assign counter cashiers, store managers, or stock leads.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCrew}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Member</span>
                  </button>
                </div>

                {crewMembers.length > 0 && (
                  <div className="space-y-2 pt-1 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                    {crewMembers.map((member, index) => (
                      <div
                        key={member.id}
                        className="p-2 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-center gap-2 text-xs"
                      >
                        <input
                          type="text"
                          placeholder={`Staff #${index + 1} Name`}
                          value={member.name}
                          onChange={(e) => handleUpdateCrew(member.id, 'name', e.target.value)}
                          className="w-full sm:w-1/3 h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Phone / WhatsApp"
                          value={member.contact}
                          onChange={(e) => handleUpdateCrew(member.id, 'contact', e.target.value)}
                          className="w-full sm:w-1/3 h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
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
                          className="w-full sm:w-1/4 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="cashier">Cashier</option>
                          <option value="manager">Manager</option>
                          <option value="inventory">Inventory Lead</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveCrew(member.id)}
                          aria-label="Remove crew member"
                          className="p-1.5 self-end sm:self-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-Shop Toggle & Join */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        Multiple Shops &amp; Branch Linking
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        Operate or join multiple retail branches from one admin console.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMultiStore}
                    onChange={(e) => setIsMultiStore(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600 shrink-0"
                  />
                </label>

                {isMultiStore && (
                  <div className="pt-1.5 animate-in fade-in">
                    <input
                      type="text"
                      value={multiStoreBranches}
                      onChange={(e) => setMultiStoreBranches(e.target.value)}
                      placeholder="e.g. Main Branch, Warehouse, Kothrud Branch"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      You can also link other existing Ellic store accounts after onboarding.
                    </p>
                  </div>
                )}
              </div>

              {/* DPDPA 2023 Affirmative Consent Checkbox */}
              <label className="flex items-start gap-2.5 pt-0.5 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
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
              <div className="flex items-center gap-2 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStage(2)}
                  className="h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={!consentAccepted || isSubmitting}
                  className="flex-1 h-11 sm:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Submitting Setup...</span>
                    </>
                  ) : (
                    <>
                      <span className="truncate">Complete Setup &amp; Request Access</span>
                      <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer note */}
          <div className="pt-1.5 sm:pt-2 text-center text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            <span>Free 14-day trial included · No credit card required</span>
            {onSwitchToSignIn && (
              <span className="block mt-0.5">
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
