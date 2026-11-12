import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Check,
  Sparkles,
  Store,
  Building2,
  Receipt,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface FinalCTAProps {
  onOpenGetStarted?: (planId?: string) => void;
  onLaunchDemo?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenGetStarted, onLaunchDemo }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      id: 'trial',
      name: '14-Day Free Trial',
      tagline: 'Risk-free full access to test with your shop items & hardware',
      badge: 'Zero Commitment',
      price: { monthly: 0, annual: 0 },
      priceDisplay: '₹0',
      period: 'for 14 days',
      features: [
        '1 Counter POS Billing Terminal',
        'Optical Barcode Scanner Support',
        'Instant WhatsApp & Thermal Invoices',
        'Dynamic UPI QR Payments',
        'Real-time Inventory Deductions',
        'Basic Customer Khata Ledger',
      ],
      buttonText: 'Start 14-Day Free Trial',
      popular: false,
    },
    {
      id: 'starter',
      name: 'Retail Starter',
      tagline: 'Ideal for Kirana, single-counter boutiques, apparel & mobile stores',
      badge: 'Essential Retail',
      price: { monthly: 999, annual: 749 },
      period: 'per month',
      features: [
        '1 High-Speed Counter Terminal',
        'Unlimited Items & Barcode Records',
        'Automated Stock Deductions & Low-Stock Alerts',
        'Digital Khata CRM & Balance WhatsApp Reminders',
        'Multi-Tender (Cash, UPI, Cards, Udhar Credit)',
        'Day-End Cash Drawer Reconciliation',
        'Offline Billing Protection',
      ],
      buttonText: 'Get Started with Starter',
      popular: false,
    },
    {
      id: 'growth',
      name: 'Supermarket & Growth Pro',
      tagline: 'For high-traffic supermarkets, department stores & busy multi-registers',
      badge: 'Most Popular',
      price: { monthly: 2499, annual: 1875 },
      period: 'per month',
      features: [
        'Up to 3 Concurrent POS Registers',
        'FIFO Batch Tracking & Expiry Alerts',
        'Cashier vs Manager Permissions & Shift Tallies',
        'Customer Credit Limits & Payment Reminders',
        'Export-ready GST (GSTR-1, Z-reports, CSV/PDF)',
        'Dual Thermal Formats (58mm / 80mm ESC/POS)',
        'Priority 24/7 Merchant Support Desk',
      ],
      buttonText: 'Choose Growth Pro',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Wholesaler & Multi-Store',
      tagline: 'For B2B wholesalers, distributors & multi-branch retail operations',
      badge: 'Multi-Location',
      price: { monthly: 4999, annual: 3749 },
      period: 'per month',
      features: [
        'Unlimited Counters & Linked Store Branches',
        'Wholesale Tiered Pricing & Bulk Catalog',
        'Inter-Store Stock Transfers & Central View',
        'B2B GST E-Invoicing & Credit Statements',
        'Onboarding Specialist Walkthrough & Setup',
        'Custom Staff Role RBAC & Full Audit Logs',
        'Dedicated Account Manager Support',
      ],
      buttonText: 'Start Enterprise Setup',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-12 sm:py-20 md:py-28 bg-slate-50/70 dark:bg-slate-950 transition-colors duration-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* ================= SECTION HEADER ================= */}
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-900">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>Transparent Value · GST Compliant</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight">
            Simple, honest plans for every retail floor.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            All plans include a 14-day free trial. No credit card required. Upgrade, scale registers, or cancel anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-3 flex items-center justify-center gap-3 select-none">
            <span
              className={`text-xs font-semibold cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'text-slate-950 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly Billing
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={billingCycle === 'annual'}
              onClick={() => setBillingCycle(prev => (prev === 'monthly' ? 'annual' : 'monthly'))}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-blue-600"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'text-slate-950 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              onClick={() => setBillingCycle('annual')}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Save 25%
              </span>
            </span>
          </div>
        </div>

        {/* ================= PRICING CARDS GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {plans.map((plan) => {
            const priceVal = billingCycle === 'annual' ? plan.price.annual : plan.price.monthly;
            const isZero = priceVal === 0;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ${
                  plan.popular
                    ? 'bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Popular Pill */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Title & Tagline */}
                  <div>
                    {!plan.popular && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                        {plan.badge}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-950 dark:text-white">
                        {isZero ? '₹0' : `₹${priceVal.toLocaleString('en-IN')}`}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {isZero ? plan.period : `/${plan.period}`}
                      </span>
                    </div>
                    {billingCycle === 'annual' && !isZero && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                        Billed annually (₹{(priceVal * 12).toLocaleString('en-IN')}/year)
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Included Capabilities:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA Button */}
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => onOpenGetStarted?.(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                    }`}
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= HARDWARE & PRINTER FAQ CALLOUT ================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Works with your existing thermal printers &amp; scanners
              </span>
              <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                No expensive proprietary hardware required. Runs on USB/Bluetooth receipt printers (TVS, NGX, Epson) and optical laser scanners.
              </span>
            </div>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-4 h-4" /> Ready on Any Device
          </span>
        </div>

        {/* ================= FINAL HIGH-CONTRAST CONVERSION BANNER ================= */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-slate-950 text-white p-6 sm:p-12 lg:p-16 overflow-hidden shadow-2xl border-2 border-slate-800">
          
          {/* Subtle Background Structural Grid & Ambient Glow */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
          <div className="hero-ambient-orb absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            
            {/* Tagline Kicker */}
            <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold tracking-widest text-sky-400 uppercase select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)] animate-pulse" />
              <span>Ellic Platform</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-semibold normal-case tracking-normal">Cloud &amp; Offline Ready</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              A simpler way to run your business.
            </h2>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
              Join progressive store owners, supermarkets, and wholesalers who have retired complicated legacy systems for a calm, connected business platform.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                id="btn-final-cta-getstarted"
                type="button"
                data-cursor="hover"
                data-magnetic="true"
                onClick={onOpenGetStarted}
                className="website-btn-glow w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm sm:text-base font-bold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span data-magnetic-inner className="flex items-center gap-2">
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-150" />
                </span>
              </button>

              {onLaunchDemo && (
                <button
                  type="button"
                  onClick={onLaunchDemo}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Launch Live Demo</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-2.5 text-[11px] sm:text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" /> Free 14-day full trial
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" /> Complete data privacy &amp; cloud backup
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

