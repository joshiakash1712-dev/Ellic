import React, { useState } from 'react';
import {
  Receipt,
  Boxes,
  Users,
  CreditCard,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MousePointer,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { SpiralWorkflowStage } from './SpiralWorkflowStage';
import { useSpiralScroll } from '../../hooks/useSpiralScroll';

interface CapabilityCard {
  id: string;
  number: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  points: string[];
  telemetry: {
    label: string;
    value: string;
    status: string;
  };
}

const capabilities: CapabilityCard[] = [
  {
    id: 'billing',
    number: '01',
    title: 'Billing & POS',
    badge: 'Sub-0.2s Checkout',
    icon: Receipt,
    description: 'Fast counter checkout with USB/Bluetooth optical barcode scanners and instant thermal printing.',
    points: [
      'Sub-second barcode scan & keyboard shortcuts',
      'Instant 58mm/80mm thermal receipts & PDF bills',
      'Direct WhatsApp digital bills sent to shoppers',
    ],
    telemetry: {
      label: 'Scan Latency',
      value: '< 0.18s per item',
      status: 'Real-time USB & Bluetooth sync',
    },
  },
  {
    id: 'inventory',
    number: '02',
    title: 'Products & Inventory',
    badge: 'Real-Time Sync',
    icon: Boxes,
    description: 'Track stock across registers with automatic deductions on every sale and proactive restock alerts.',
    points: [
      'Automatic stock deduction on every sale',
      'Batch tracking with 30-day expiry warnings',
      'Built-in barcode generator & label printing',
    ],
    telemetry: {
      label: 'Stock Reconciliation',
      value: 'Instant FIFO Deduct',
      status: 'Multi-register ledger',
    },
  },
  {
    id: 'customers',
    number: '03',
    title: 'Customers & Khata',
    badge: 'Zero-Paper Ledger',
    icon: Users,
    description: 'Replace paper diaries with a digital Khata credit book and automated payment reminders.',
    points: [
      'Customer credit limits to prevent overdue exposure',
      '1-tap WhatsApp balance reminders with UPI payment links',
      'Full purchase history & loyalty points per buyer',
    ],
    telemetry: {
      label: 'Credit Safeguard',
      value: 'Dynamic Cap Enforcement',
      status: 'Auto WhatsApp UPI links',
    },
  },
  {
    id: 'payments',
    number: '04',
    title: 'Payments & Settlements',
    badge: 'Multi-Tender',
    icon: CreditCard,
    description: 'Accept any tender: dynamic exact-amount UPI QR codes, debit/credit cards, cash, and split bills.',
    points: [
      'Dynamic UPI QR generated per invoice for scan-and-pay',
      'Split payments (e.g. part cash + part UPI + part credit)',
      'Cash drawer reconciliation on shift handover',
    ],
    telemetry: {
      label: 'Tender Settlement',
      value: 'Dynamic Exact-Amount UPI',
      status: 'Instant verification',
    },
  },
  {
    id: 'team',
    number: '05',
    title: 'Team & Access Control',
    badge: '4-Digit PINs',
    icon: ShieldCheck,
    description: 'Keep your cash register secure with role-based access control and rapid cashier switching.',
    points: [
      'Quick 4-digit PIN login for counter cashiers',
      'Shift opening and closing drawer cash balancing',
      'Protect discount approval & wholesale buying prices',
    ],
    telemetry: {
      label: 'Security & Shifts',
      value: '4-Digit Fast PIN Switch',
      status: 'Blind drawer cash tallies',
    },
  },
  {
    id: 'reports',
    number: '06',
    title: 'Reports & Records',
    badge: 'Audit Ready',
    icon: BarChart3,
    description: 'Daily Z-reports, gross profit margins, and GST tax breakdowns generated without manual calculation.',
    points: [
      'End-of-day Z-reports generated in 60 seconds',
      'GSTR-1 sales schedules with HSN summary export',
      'Tamper-evident audit logs of every price override',
    ],
    telemetry: {
      label: 'Compliance Engine',
      value: 'GSTR-1 Ready (1-Click CSV)',
      status: 'Automated tax reconciliation',
    },
  },
];

export const CoreCapabilities: React.FC = () => {
  const [activeCapIndex, setActiveCapIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const currentCap = capabilities[activeCapIndex] || capabilities[0];
  const Icon = currentCap.icon;

  const handleCapSelect = React.useCallback((idx: number) => {
    setActiveCapIndex(idx);
  }, []);

  const {
    sectionRef,
    cardRef,
    progress,
    currentTickStep,
    scrollProps,
    scrollToNextSection,
  } = useSpiralScroll({
    totalItems: capabilities.length,
    activeIndex: activeCapIndex,
    onActiveChange: setActiveCapIndex,
    sectionId: 'features',
  });

  const capItems = React.useMemo(
    () =>
      capabilities.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        tagline: c.badge,
        description: c.description,
        icon: c.icon,
      })),
    []
  );

  return (
    <section
      ref={sectionRef}
      id="features"
      data-work-wheel="true"
      className="py-6 sm:py-8 lg:py-10 scroll-mt-20 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-4 sm:mb-6 lg:mb-7">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight break-words">
            Six tools unified into one calm platform.
          </h2>
        </div>

        {/* Mobile / Tablet Horizontal Capability Pills & Compact Spiral Stage */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 mb-3 scrollbar-none">
          {capabilities.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCapSelect(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCapIndex === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="font-mono text-[10px] opacity-75">{c.number}</span>
              <span>{c.title}</span>
            </button>
          ))}
        </div>

        <div className="lg:hidden mb-4">
          <SpiralWorkflowStage
            items={capItems}
            activeIndex={activeCapIndex}
            progress={progress}
            currentTickStep={currentTickStep}
            onActiveChange={handleCapSelect}
            label="Capabilities '26"
            sublabel="Core Platform"
            compact={true}
            className="min-h-[250px]"
          />
        </div>

        {/* Side-by-Side: Interactive 3D Spiral Stage on Left, Live Scrolling Capability Monitor on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 xl:gap-7 items-stretch">
          
          {/* Left: 3D Spiral Orbit Stage */}
          <div className="hidden lg:flex lg:col-span-6 flex-col">
            <SpiralWorkflowStage
              items={capItems}
              activeIndex={activeCapIndex}
              progress={progress}
              currentTickStep={currentTickStep}
              onActiveChange={handleCapSelect}
              label="Capabilities '26"
              sublabel="Core Platform"
              className="h-full min-h-[clamp(360px,52vh,440px)]"
            />
          </div>

          {/* Right: Live Capability Monitor */}
          <div className="col-span-1 lg:col-span-6 flex flex-col">
            <div
              ref={cardRef}
              {...scrollProps}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md flex flex-col justify-between h-full outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-200 dark:border-slate-800 gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="ml-1 text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 truncate">
                      Live Capability Monitor
                    </span>
                  </div>
                </div>

                {/* Animated Capability Details with internal scroll safeguard */}
                <div className="flex-1 overflow-y-auto max-h-[min(420px,calc(100dvh-14.5rem))] pr-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentCap.id}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="space-y-3.5"
                    >
                      {/* Title & Tagline */}
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-sky-400 uppercase tracking-wider">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{currentCap.badge}</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-0.5">
                          {currentCap.title}
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {currentCap.description}
                        </p>
                      </div>

                      {/* Operational Telemetry Card */}
                      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border-2 border-slate-300 dark:border-slate-800 shadow-2xs">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {currentCap.telemetry.label}
                          </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-sky-400">
                            {currentCap.telemetry.value}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{currentCap.telemetry.status}</span>
                        </div>
                      </div>

                      {/* Feature Points Checklist */}
                      <div className="pt-1.5 space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                          Included In Store License
                        </div>
                        {currentCap.points.map((point, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{point}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

              {/* Bottom Card Controls & Footer */}
              <div className="pt-3 mt-3 border-t-2 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  disabled={activeCapIndex === 0}
                  onClick={() => handleCapSelect(Math.max(0, activeCapIndex - 1))}
                  className="px-3.5 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Prev Tool</span>
                </button>

                <div className="text-[11px] font-mono font-medium text-slate-500">
                  {activeCapIndex + 1} / {capabilities.length}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeCapIndex < capabilities.length - 1) {
                      handleCapSelect(activeCapIndex + 1);
                    } else {
                      scrollToNextSection();
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition-colors border border-blue-700"
                >
                  <span>{activeCapIndex === capabilities.length - 1 ? 'Next Section' : 'Next Tool'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
