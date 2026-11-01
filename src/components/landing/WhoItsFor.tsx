import React, { useState } from 'react';
import {
  ShoppingBag,
  Shirt,
  Wrench,
  Pill,
  Truck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MousePointer,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { WorkWheelStage } from './WorkWheelStage';
import { useCardWheelScroll } from '../../hooks/useCardWheelScroll';

interface Vertical {
  id: string;
  number: string;
  name: string;
  icon: React.ElementType;
  tagline: string;
  summary: string;
  keyFeatures: string[];
  preset: string;
}

const verticals: Vertical[] = [
  {
    id: 'grocery',
    number: '01',
    name: 'Supermarkets & Grocery',
    icon: ShoppingBag,
    tagline: 'High Volume & Quick Queues',
    summary: 'Speed through evening counter rushes with sub-second optical scanning and automated batch expiry monitoring.',
    keyFeatures: [
      'Sub-0.2s barcode scanning for long counter queues',
      'First-in-first-out (FIFO) batch tracking with expiry alerts',
      'Dynamic UPI QR codes for instant contactless payments',
    ],
    preset: 'Pre-loaded with 4,000+ FMCG grocery barcodes & tax slabs',
  },
  {
    id: 'fashion',
    number: '02',
    name: 'Retail & Fashion',
    icon: Shirt,
    tagline: 'Apparel, Footwear & Variants',
    summary: 'Manage complex size, fit, and color variants without clutter. Print custom thermal barcode hang-tags.',
    keyFeatures: [
      'Parent-child variant matrix (Sizes & Colors under 1 master SKU)',
      'Built-in thermal barcode price tag & hang-tag generator',
      'Seasonal promotional discounts & customer loyalty points',
    ],
    preset: 'Pre-configured apparel size scales (S-XXL) & footwear sizing',
  },
  {
    id: 'hardware',
    number: '03',
    name: 'Hardware & Electricals',
    icon: Wrench,
    tagline: 'Tools, Multi-Unit & Contractor Khata',
    summary: 'Handle versatile measurement units and maintain flexible credit Khata accounts for local contractors.',
    keyFeatures: [
      'Multi-unit packaging (pieces, meters, kg, boxes)',
      'Digital contractor Khata with WhatsApp payment reminders',
      'Serial number & warranty tracking on appliances',
    ],
    preset: 'Supports loose metric conversions & contractor credit caps',
  },
  {
    id: 'pharmacy',
    number: '04',
    name: 'Pharmacies & Wellness',
    icon: Pill,
    tagline: 'Batch Numbers & Regulation',
    summary: 'Track medication batches, expiry alerts, and maintain 100% compliant statutory GST records.',
    keyFeatures: [
      'Batch-wise stock tracking with automated 30-day expiry flags',
      'Accurate HSN codes and GST slab mapping',
      'Fast counter lookup by brand or generic molecule name',
    ],
    preset: 'Strict FIFO batch validation & compliant drug register format',
  },
  {
    id: 'wholesale',
    number: '05',
    name: 'Wholesale & B2B Supply',
    icon: Truck,
    tagline: 'Trade Invoices & Tiered Pricing',
    summary: 'Run bulk trade with merchant pricing tiers, credit limit enforcement, and GST e-invoices.',
    keyFeatures: [
      'Distributor vs Retailer vs Walk-in price tiers',
      'Credit limit safeguards that block billing over credit caps',
      'Full B2B tax invoice and delivery challan printing',
    ],
    preset: 'Tiered wholesale price levels & bulk packing carton counts',
  },
];

export const WhoItsFor: React.FC = () => {
  const [activeVerticalIndex, setActiveVerticalIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const currentVertical = verticals[activeVerticalIndex] || verticals[0];
  const Icon = currentVertical.icon;

  const handleVerticalSelect = React.useCallback((idx: number) => {
    setActiveVerticalIndex(idx);
  }, []);

  // Work wheel scrolling with screen centering and page-lock until last card
  const {
    sectionRef,
    cardRef,
    scrollProps,
    isLastItem,
    scrollToNextSection,
  } = useCardWheelScroll({
    totalItems: verticals.length,
    activeIndex: activeVerticalIndex,
    onActiveChange: setActiveVerticalIndex,
    sectionId: 'who-its-for',
  });

  return (
    <section
      ref={sectionRef}
      id="who-its-for"
      data-work-wheel="true"
      className="py-6 sm:py-8 lg:py-10 scroll-mt-20 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors overflow-hidden relative"
    >
      <div id="solutions" className="absolute top-0 left-0 -mt-20" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-4 sm:mb-6 lg:mb-7">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight break-words">
            Tailored for your specific retail floor.
          </h2>
        </div>

        {/* Side-by-Side: Interactive Work Wheel on Left, Live Scrolling Profile Monitor on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-stretch">
          
          {/* Left: Vector Work Wheel Dial Component (Hidden on mobile for clean preview, visible on desktop) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 flex-col">
            <WorkWheelStage
              items={verticals.map((v) => ({
                id: v.id,
                number: v.number,
                title: v.name,
                tagline: v.tagline,
                icon: v.icon,
              }))}
              activeIndex={activeVerticalIndex}
              onActiveChange={handleVerticalSelect}
              label="Retail Sectors"
              sublabel="Ready Presets"
              className="h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]"
            />
          </div>

          {/* Right: Live Industry Profile Monitor (Target Card with Work Wheel scrolling applied) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
            <div
              ref={cardRef}
              {...scrollProps}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col justify-between h-full outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-grab active:cursor-grabbing"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="ml-1 text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 truncate">
                      Live Industry Profile
                    </span>
                  </div>

                  {isLastItem ? (
                    <button
                      type="button"
                      onClick={scrollToNextSection}
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 px-2.5 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer shrink-0"
                      title="All sectors viewed. Scroll or click to continue to next section"
                    >
                      <span>Unlocked • Scroll down ↓</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-700 dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 px-2 py-0.5 rounded shrink-0 font-medium">
                      <MousePointer className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Anchored ({activeVerticalIndex + 1}/{verticals.length}) • Scroll down</span>
                      <span className="sm:hidden">{activeVerticalIndex + 1}/{verticals.length} • Scroll</span>
                    </span>
                  )}
                </div>

                {/* Animated Vertical Details with internal scroll safeguard */}
                <div className="flex-1 overflow-y-auto max-h-[min(480px,calc(100dvh-15.5rem))] pr-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentVertical.id}
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
                          <span>{currentVertical.tagline}</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white mt-0.5">
                          {currentVertical.name}
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {currentVertical.summary}
                        </p>
                      </div>

                      {/* Pre-Configured Preset Card */}
                      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                          <span>Pre-Configured Out of the Box</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {currentVertical.preset}
                        </div>
                      </div>

                      {/* Key Features Checklist */}
                      <div className="pt-1.5 space-y-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                          Specialized Workflows
                        </div>
                        {currentVertical.keyFeatures.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

              {/* Bottom Card Controls & Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  disabled={activeVerticalIndex === 0}
                  onClick={() => handleVerticalSelect(Math.max(0, activeVerticalIndex - 1))}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Prev Sector</span>
                </button>

                <div className="text-[11px] font-mono font-medium text-slate-400">
                  {activeVerticalIndex + 1} / {verticals.length}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeVerticalIndex < verticals.length - 1) {
                      handleVerticalSelect(activeVerticalIndex + 1);
                    } else {
                      scrollToNextSection();
                    }
                  }}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
                >
                  <span>{activeVerticalIndex === verticals.length - 1 ? 'Next Section' : 'Next Sector'}</span>
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
