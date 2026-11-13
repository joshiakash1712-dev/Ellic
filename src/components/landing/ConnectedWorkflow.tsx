import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { UnifiedSpiralShowcase } from './UnifiedSpiralShowcase';
import type { SpiralDialItemDef } from './SpiralDialPanel';

interface WorkflowStage extends SpiralDialItemDef {
  id: string;
  number: string;
  name: string;
  title: string;
  icon: React.ElementType;
  tagline: string;
  description: string;
  summary: string;
  rippleEffect: string;
  mockupSnippet: {
    title: string;
    badge: string;
    lines: Array<{ label: string; value: string }>;
  };
}

const rawStages = [
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

  const stageItems: WorkflowStage[] = useMemo(
    () =>
      rawStages.map((s) => ({
        ...s,
        title: s.name,
        description: s.summary,
      })),
    []
  );

  return (
    <UnifiedSpiralShowcase
      sectionId="workflow"
      eyebrow="Connected Store Engine"
      heading="How data flows through your store."
      description="Every barcode scan updates billing, inventory, Khata credit, and daily GST books simultaneously."
      items={stageItems}
      activeIndex={activeStageIndex}
      onActiveChange={setActiveStageIndex}
      dialLabel="Workflow '26"
      dialSublabel="Live Sync"
      prevLabel="Prev Stage"
      nextLabel="Next Stage"
      renderSimulator={(stage, { index, total, isActive, isInteractive, onPrev, onNext }) => (
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
          {/* Simulator Header */}
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
                Workflow Simulator
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] text-[#94A3B8] font-medium shrink-0 italic">
              Interactive preview · Sample data
            </span>
          </div>

          {/* Stage Telemetry & Mockup Body */}
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-3 scrollbar-thin">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider">
                STAGE {stage.number} · {stage.tagline}
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5 flex items-center gap-2">
                <span>{stage.name}</span>
              </h3>
              <p className="mt-1 text-xs text-[#CBD5E1] leading-relaxed">
                {stage.summary}
              </p>
            </div>

            {/* Stage Live Data Mockup */}
            <div
              className="p-3 rounded-xl border space-y-2 font-sans"
              style={{
                backgroundColor: '#070B14',
                borderColor: 'rgba(56, 189, 248, 0.22)',
              }}
            >
              <div
                className="flex items-center justify-between pb-1.5 border-b gap-2"
                style={{ borderColor: 'rgba(148, 163, 184, 0.16)' }}
              >
                <span className="text-xs font-bold text-[#E2E8F0] flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span className="truncate">{stage.mockupSnippet.title}</span>
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 font-bold"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.22)',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    color: '#7DD3FC',
                  }}
                >
                  {stage.mockupSnippet.badge}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {stage.mockupSnippet.lines.map((l, i) => (
                  <div
                    key={i}
                    className="p-1.5 sm:p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2"
                    style={{
                      backgroundColor: '#0E1726',
                      borderColor: 'rgba(148, 163, 184, 0.16)',
                    }}
                  >
                    <span className="text-[#94A3B8] text-[11px]">{l.label}</span>
                    <span className="font-mono font-semibold text-white text-[11px]">
                      {l.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Automated Action */}
            <div
              className="p-2.5 sm:p-3 rounded-xl border space-y-1"
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                borderColor: 'rgba(56, 189, 248, 0.28)',
              }}
            >
              <div className="flex items-center gap-1.5 text-[#7DD3FC] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span className="text-[11px]">Next Automated Action:</span>
              </div>
              <div className="text-[#CBD5E1] text-xs leading-relaxed">
                {stage.rippleEffect}
              </div>
            </div>
          </div>

          {/* Synchronized Panel Controls */}
          <div
            className="pt-2.5 mt-2.5 border-t flex items-center justify-between gap-2 text-xs shrink-0"
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
              <span>Prev Stage</span>
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
              <span>{index === total - 1 ? 'Next Section' : 'Next Stage'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    />
  );
};
