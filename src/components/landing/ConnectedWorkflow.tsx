import React, { useState } from 'react';
import {
  Tag,
  Users,
  Receipt,
  CreditCard,
  Boxes,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  MousePointer,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { SpiralWorkflowStage } from './SpiralWorkflowStage';
import { useSpiralScroll } from '../../hooks/useSpiralScroll';

interface WorkflowStage {
  id: string;
  number: string;
  name: string;
  icon: React.ElementType;
  tagline: string;
  summary: string;
  rippleEffect: string;
  mockupSnippet: {
    title: string;
    badge: string;
    lines: Array<{ label: string; value: string }>;
  };
}

const stages: WorkflowStage[] = [
  {
    id: 'products',
    number: '01',
    name: 'Products',
    icon: Tag,
    tagline: 'Catalog & Barcodes',
    summary: 'Add SKUs once with barcode, purchase price, selling price, and GST tax slab.',
    rippleEffect: 'Immediately ready for counter barcode scanners and stock tracking.',
    mockupSnippet: {
      title: 'Catalog Record',
      badge: 'Active SKU',
      lines: [
        { label: 'Item', value: 'Basmati Rice Superior 5kg' },
        { label: 'Barcode', value: '8901234567890 (EAN-13)' },
        { label: 'Retail Price', value: '₹480.00 (Margin: +26%)' },
      ],
    },
  },
  {
    id: 'customers',
    number: '02',
    name: 'Customers',
    icon: Users,
    tagline: 'Profiles & Khata',
    summary: 'Identify repeat buyers by phone number and manage customer credit limits.',
    rippleEffect: 'Links purchase history and credit balance to the customer’s profile.',
    mockupSnippet: {
      title: 'Customer Profile',
      badge: 'VIP Member',
      lines: [
        { label: 'Customer', value: 'Rahul Deshmukh (+91 98XXX XXXXX)' },
        { label: 'Khata Balance', value: '₹420.00 Outstanding' },
        { label: 'Credit Limit', value: '₹5,000 Safe Cap' },
      ],
    },
  },
  {
    id: 'billing',
    number: '03',
    name: 'Billing',
    icon: Receipt,
    tagline: 'Counter Scan-to-Bill',
    summary: 'Scan items in sub-seconds with optical laser or keyboard search.',
    rippleEffect: 'Generates instant GST-compliant thermal receipts or WhatsApp bills.',
    mockupSnippet: {
      title: 'POS Active Invoice',
      badge: 'INV-2026-0842',
      lines: [
        { label: 'Cart Items', value: '3 Line Items Scanned' },
        { label: 'Total', value: '₹880.00 (CGST + SGST included)' },
        { label: 'Speed', value: '< 0.2s per barcode scan' },
      ],
    },
  },
  {
    id: 'payments',
    number: '04',
    name: 'Payments',
    icon: CreditCard,
    tagline: 'Cash, UPI QR, Cards & Split',
    summary: 'Accept any tender: dynamic scan-and-pay UPI QR, cards, cash, or credit Khata.',
    rippleEffect: 'Settles payment instantly and flags any remaining credit balance.',
    mockupSnippet: {
      title: 'Payment Settlement',
      badge: 'Split Tender Ready',
      lines: [
        { label: 'Paid via UPI QR', value: '₹500.00 (Instant)' },
        { label: 'Added to Khata', value: '₹380.00 (Due Recorded)' },
        { label: 'Status', value: 'Verified & Closed' },
      ],
    },
  },
  {
    id: 'inventory',
    number: '05',
    name: 'Inventory',
    icon: Boxes,
    tagline: 'Live Stock Deduction',
    summary: 'Stock automatically deducts across registers the instant a bill is completed.',
    rippleEffect: 'Warns you before shelves run empty and drafts wholesale reorders.',
    mockupSnippet: {
      title: 'Live Stock Engine',
      badge: 'Real-Time Sync',
      lines: [
        { label: 'Rice 5kg Pool', value: '42 → 41 units remaining' },
        { label: 'Threshold Alert', value: 'Healthy (> 10 units min)' },
        { label: 'Batch Expiry', value: 'Dec 2027 (FIFO Tracked)' },
      ],
    },
  },
  {
    id: 'records',
    number: '06',
    name: 'Records',
    icon: FileText,
    tagline: 'Reports, GST & Audit Logs',
    summary: 'Sales, drawer cash, and GST tax schedules update without manual tallying.',
    rippleEffect: 'No late-night spreadsheets. End-of-day Z-reports are ready in 60 seconds.',
    mockupSnippet: {
      title: 'Daily Business Summary',
      badge: 'Automated Record',
      lines: [
        { label: 'Gross Sales Today', value: '₹48,920 (84 Invoices)' },
        { label: 'Drawer Cash Tally', value: 'Exact match (0 variance)' },
        { label: 'GST Export', value: 'GSTR-1 Ready (1-Click CSV)' },
      ],
    },
  },
];

export const ConnectedWorkflow: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const currentStage = stages[activeStageIndex] || stages[0];

  const handleStageSelect = React.useCallback((idx: number) => {
    setActiveStageIndex(idx);
  }, []);

  const {
    sectionRef,
    cardRef,
    progress,
    currentTickStep,
    scrollProps,
    scrollToNextSection,
  } = useSpiralScroll({
    totalItems: stages.length,
    activeIndex: activeStageIndex,
    onActiveChange: setActiveStageIndex,
    sectionId: 'workflow',
  });

  const stageItems = React.useMemo(
    () =>
      stages.map((s) => ({
        id: s.id,
        number: s.number,
        title: s.name,
        tagline: s.tagline,
        description: s.summary,
        icon: s.icon,
      })),
    []
  );

  return (
    <section
      ref={sectionRef}
      id="workflow"
      data-work-wheel="true"
      className="py-6 sm:py-8 lg:py-10 scroll-mt-20 bg-slate-50/70 dark:bg-slate-950 border-b-2 border-slate-200 dark:border-slate-800 transition-colors overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-4 sm:mb-6 lg:mb-7">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight break-words">
            How data flows through your store.
          </h2>
        </div>

        {/* Mobile / Tablet Horizontal Workflow Stage Pills & Compact Spiral Stage */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 mb-3 scrollbar-none">
          {stages.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStageSelect(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeStageIndex === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="font-mono text-[10px] opacity-75">{s.number}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        <div className="lg:hidden mb-4">
          <SpiralWorkflowStage
            items={stageItems}
            activeIndex={activeStageIndex}
            progress={progress}
            currentTickStep={currentTickStep}
            onActiveChange={handleStageSelect}
            label="Workflow '26"
            sublabel="Live Sync"
            compact={true}
            className="min-h-[250px]"
          />
        </div>

        {/* Side-by-Side: Interactive 3D Spiral Stage on Left, Live Scrolling Monitor Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 xl:gap-7 items-stretch">
          
          {/* Left: 3D Spiral Orbit Stage */}
          <div className="hidden lg:flex lg:col-span-6 flex-col">
            <SpiralWorkflowStage
              items={stageItems}
              activeIndex={activeStageIndex}
              progress={progress}
              currentTickStep={currentTickStep}
              onActiveChange={handleStageSelect}
              label="Workflow '26"
              sublabel="Live Sync"
              className="h-full min-h-[clamp(360px,52vh,440px)]"
            />
          </div>

          {/* Right: Live Interactive Workflow Monitor Card */}
          <div className="col-span-1 lg:col-span-6 flex flex-col">
            <div
              ref={cardRef}
              {...scrollProps}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl flex flex-col justify-between h-full outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-slate-200 dark:border-slate-800 gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="ml-1 text-[11px] font-mono uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 truncate">
                    Workflow Simulator
                  </span>
                </div>
                <span className="hidden sm:inline-block text-[10px] text-slate-500 dark:text-slate-400 font-medium shrink-0 italic">
                  Interactive product preview · Sample data
                </span>
              </div>

              {/* Animated Stage Details with internal scroll safeguard */}
              <div className="flex-1 overflow-y-auto max-h-[min(420px,calc(100dvh-14.5rem))] pr-0.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStage.id}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: prefersReducedMotion ? 0.05 : 0.2, ease: 'easeOut' }}
                    className="space-y-3"
                  >
                    {/* Stage Name & Tagline */}
                    <div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-sky-400 uppercase tracking-wider">
                        {currentStage.tagline}
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white mt-0.5 flex items-center gap-2">
                        <span>{currentStage.name}</span>
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {currentStage.summary}
                      </p>
                    </div>

                    {/* Stage Live Data Mockup */}
                    <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-800 space-y-2 font-sans shadow-2xs">
                      <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-200 dark:border-slate-800 gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                          <span className="truncate">{currentStage.mockupSnippet.title}</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-sky-700/60 shrink-0 font-bold">
                          {currentStage.mockupSnippet.badge}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {currentStage.mockupSnippet.lines.map((l, i) => (
                          <div
                            key={i}
                            className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2 shadow-2xs"
                          >
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">{l.label}</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
                              {l.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ripple Effect (Next Automated Action) */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-900/60 space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-blue-700 dark:text-sky-300 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                        <span className="text-[11px]">Next Automated Action:</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                        {currentStage.rippleEffect}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Prev / Next Stage Controls */}
              <div className="px-4 py-2.5 border-t-2 border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-500 bg-slate-100/60 dark:bg-slate-950/40 shrink-0 rounded-b-xl">
                <button
                  type="button"
                  disabled={activeStageIndex === 0}
                  onClick={() => handleStageSelect(Math.max(0, activeStageIndex - 1))}
                  className="px-3 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Prev Stage</span>
                </button>

                <div className="text-[11px] font-mono font-medium text-slate-500">
                  {activeStageIndex + 1} / {stages.length}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeStageIndex < stages.length - 1) {
                      handleStageSelect(activeStageIndex + 1);
                    } else {
                      scrollToNextSection();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition-colors border border-blue-700"
                >
                  <span>{activeStageIndex === stages.length - 1 ? 'Next Section' : 'Next Stage'}</span>
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
