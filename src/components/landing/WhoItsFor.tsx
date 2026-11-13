import React, { useMemo, useState } from 'react';
import {
  ShoppingBag,
  Shirt,
  Wrench,
  Pill,
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { UnifiedSpiralShowcase } from './UnifiedSpiralShowcase';
import type { SpiralDialItemDef } from './SpiralDialPanel';

interface VerticalItem extends SpiralDialItemDef {
  id: string;
  number: string;
  name: string;
  title: string;
  icon: React.ElementType;
  tagline: string;
  description: string;
  summary: string;
  keyFeatures: string[];
  preset: string;
}

const rawVerticals = [
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

  const verticalItems: VerticalItem[] = useMemo(
    () =>
      rawVerticals.map((v) => ({
        ...v,
        title: v.name,
        description: v.summary,
      })),
    []
  );

  return (
    <UnifiedSpiralShowcase
      sectionId="who-its-for"
      anchorAliasId="solutions"
      eyebrow="Built For Every Store Format"
      heading="Tailored for your specific retail floor."
      description="Pre-configured retail presets adjust units, variants, batch tracking, and billing shortcuts to match your trade."
      items={verticalItems}
      activeIndex={activeVerticalIndex}
      onActiveChange={setActiveVerticalIndex}
      dialLabel="Retail Sectors"
      dialSublabel="Ready Presets"
      prevLabel="Prev Sector"
      nextLabel="Next Sector"
      renderSimulator={(vertical, { index, total, isActive, isInteractive, onPrev, onNext }) => {
        const VertIcon = vertical.icon;
        return (
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
                  Live Industry Profile
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
                Sector {vertical.number}
              </span>
            </div>

            {/* Vertical Details */}
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-3 scrollbar-thin">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider">
                  <VertIcon className="w-3.5 h-3.5" />
                  <span>{vertical.tagline}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  {vertical.name}
                </h3>
                <p className="mt-1 text-xs text-[#CBD5E1] leading-relaxed">
                  {vertical.summary}
                </p>
              </div>

              {/* Pre-Configured Preset Card */}
              <div
                className="p-3 rounded-xl border"
                style={{
                  backgroundColor: '#070B14',
                  borderColor: 'rgba(56, 189, 248, 0.22)',
                }}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Pre-Configured Out of the Box</span>
                </div>
                <div className="text-xs font-semibold text-white">
                  {vertical.preset}
                </div>
              </div>

              {/* Key Features Checklist */}
              <div className="pt-1 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                  Specialized Workflows
                </div>
                {vertical.keyFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#E2E8F0]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                    <span className="leading-snug">{feat}</span>
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
                <span>Prev Sector</span>
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
                <span>{index === total - 1 ? 'Next Section' : 'Next Sector'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      }}
    />
  );
};
