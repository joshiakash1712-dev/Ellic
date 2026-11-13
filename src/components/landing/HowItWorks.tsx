import React, { useMemo, useState } from 'react';
import {
  Store,
  Receipt,
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { UnifiedSpiralShowcase } from './UnifiedSpiralShowcase';
import type { SpiralDialItemDef } from './SpiralDialPanel';

interface StepItem extends SpiralDialItemDef {
  id: string;
  number: string;
  step: string;
  title: string;
  tagline: string;
  time: string;
  description: string;
  icon: React.ElementType;
  preview: {
    heading: string;
    items: string[];
  };
  impact: string;
}

const rawSteps = [
  {
    id: 'products',
    step: '01',
    title: 'Add your products',
    time: '< 5 Minutes',
    description: 'Import your catalog via spreadsheet or scan items on your counter. Set selling prices and GST slabs once.',
    icon: Store,
    preview: {
      heading: 'Catalog Ready',
      items: [
        'Scan EAN/UPC barcodes directly at the counter',
        'Auto-calculate margin (+26%) and retail markup',
        'Assign 5/12/18% statutory GST tax slabs',
      ],
    },
    impact: 'Ready for instant optical laser barcode checkout',
  },
  {
    id: 'billing',
    step: '02',
    title: 'Bill in sub-seconds',
    time: 'Daily Counter',
    description: 'Cashiers scan items with any USB/Bluetooth scanner. Print thermal receipts or send digital bills via WhatsApp.',
    icon: Receipt,
    preview: {
      heading: 'Sub-0.2s POS',
      items: [
        'Plug-and-play USB & Bluetooth barcode scanner input',
        'Dynamic exact-amount UPI QR code checkout',
        'Split tender across cash, cards, & credit Khata',
      ],
    },
    impact: 'Cuts checkout queue times by over 70%',
  },
  {
    id: 'records',
    step: '03',
    title: 'Stay in sync automatically',
    time: 'Always Live',
    description: 'Every sale automatically decrements stock, updates customer Khata balances, and prepares your daily Z-report.',
    icon: TrendingUp,
    preview: {
      heading: 'Auto-Reconciliation',
      items: [
        'Live inventory count deducted across registers',
        'Zero-paper customer credit balances logged instantly',
        '60-second end-of-shift cash drawer balancing',
      ],
    },
    impact: 'Zero night-time bookkeeping or spreadsheet tallies',
  },
];

export const HowItWorks: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const stepItems: StepItem[] = useMemo(
    () =>
      rawSteps.map((s) => ({
        ...s,
        number: s.step,
        tagline: s.time,
      })),
    []
  );

  return (
    <UnifiedSpiralShowcase
      sectionId="how-it-works"
      eyebrow="Rapid Store Onboarding"
      heading="Up and running in minutes."
      description="Go from unboxing to billing customers in under five minutes—no IT specialist or manual server setup required."
      items={stepItems}
      activeIndex={activeStepIndex}
      onActiveChange={setActiveStepIndex}
      dialLabel="Steps '26"
      dialSublabel="Fast Setup"
      prevLabel="Prev Step"
      nextLabel="Next Step"
      renderSimulator={(step, { index, total, isActive, isInteractive, onPrev, onNext }) => (
        <div
          className="p-4 sm:p-5 rounded-2xl border flex flex-col justify-between h-full transition-colors duration-200"
          style={{
            backgroundColor: isActive ? '#0E1726' : '#09111E',
            borderColor: isActive ? 'rgba(56, 189, 248, 0.34)' : 'rgba(148, 163, 184, 0.2)',
            boxShadow: isActive
              ? '0 22px 48px -12px rgba(0, 0, 0, 0.72), 0 0 28px rgba(37, 99, 235, 0.18), inset 0 1px 0 rgba(186, 230, 253, 0.14)'
              : '0 14px 32px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Header Badge */}
          <div
            className="flex items-center justify-between pb-2.5 mb-2.5 border-b gap-2 shrink-0"
            style={{ borderColor: 'rgba(56, 189, 248, 0.16)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="ml-1 text-[11px] font-mono uppercase tracking-wider font-bold text-[#CBD5E1] truncate">
                Live Implementation Monitor
              </span>
            </div>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.22)',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#7DD3FC',
              }}
            >
              {step.time}
            </span>
          </div>

          {/* Step Details */}
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-3 scrollbar-thin">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>STEP {step.step} · Setup Time: {step.time}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                {step.title}
              </h3>
              <p className="mt-1 text-xs text-[#CBD5E1] leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Operational Impact Card */}
            <div
              className="p-3 rounded-xl border"
              style={{
                backgroundColor: '#070B14',
                borderColor: 'rgba(56, 189, 248, 0.22)',
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold mb-1">
                Operational Impact
              </div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>{step.impact}</span>
              </div>
            </div>

            {/* Execution Checklist */}
            <div className="pt-1 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                {step.preview.heading}
              </div>
              {step.preview.items.map((it, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#E2E8F0]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                  <span className="leading-snug">{it}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Controls */}
          <div
            className="pt-2.5 mt-2.5 border-t flex items-center justify-between gap-2 shrink-0"
            style={{ borderColor: 'rgba(56, 189, 248, 0.16)' }}
          >
            <button
              type="button"
              tabIndex={isInteractive ? 0 : -1}
              disabled={index === 0}
              onClick={onPrev}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-[#E2E8F0] hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
              style={{
                backgroundColor: '#070B14',
                borderColor: 'rgba(148, 163, 184, 0.3)',
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Prev Step</span>
            </button>

            <div className="text-[11px] font-mono font-medium text-[#94A3B8]">
              {index + 1} / {total}
            </div>

            <button
              type="button"
              tabIndex={isInteractive ? 0 : -1}
              onClick={onNext}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-[#38BDF8]/50"
            >
              <span>{index === total - 1 ? 'Next Section' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    />
  );
};
