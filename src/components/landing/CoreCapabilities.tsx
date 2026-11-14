import React, { useMemo, useState } from 'react';
import {
  Receipt,
  Boxes,
  Users,
  CreditCard,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { UnifiedSpiralShowcase } from './UnifiedSpiralShowcase';
import type { SpiralDialItemDef } from './SpiralDialPanel';

interface CapabilityCard extends SpiralDialItemDef {
  id: string;
  number: string;
  title: string;
  tagline: string;
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

const rawCapabilities = [
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

  const capItems: CapabilityCard[] = useMemo(
    () =>
      rawCapabilities.map((c) => ({
        ...c,
        tagline: c.badge,
      })),
    []
  );

  return (
    <UnifiedSpiralShowcase
      sectionId="features"
      eyebrow="Unified Retail OS"
      heading="Six tools unified into one calm platform."
      description="Replace fragmented billing software, stock spreadsheets, and paper ledgers with one synchronized retail cockpit."
      items={capItems}
      activeIndex={activeCapIndex}
      onActiveChange={setActiveCapIndex}
      dialLabel="Capabilities '26"
      dialSublabel="Core Platform"
      prevLabel="Prev Tool"
      nextLabel="Next Tool"
      renderSimulator={(cap, { index, total, isActive, isInteractive, onPrev, onNext }) => {
        const CapIcon = cap.icon;
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
                  Live Capability Monitor
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
                {cap.badge}
              </span>
            </div>

            {/* Capability Details */}
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-3 scrollbar-thin">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider">
                  <CapIcon className="w-3.5 h-3.5" />
                  <span>TOOL {cap.number} · {cap.badge}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  {cap.title}
                </h3>
                <p className="mt-1 text-xs text-[#CBD5E1] leading-relaxed">
                  {cap.description}
                </p>
              </div>

              {/* Operational Telemetry Card */}
              <div
                className="p-3 rounded-xl border"
                style={{
                  backgroundColor: '#070B14',
                  borderColor: 'rgba(56, 189, 248, 0.22)',
                }}
              >
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <span className="text-[#94A3B8] font-medium">
                    {cap.telemetry.label}
                  </span>
                  <span className="font-mono font-bold text-[#38BDF8]">
                    {cap.telemetry.value}
                  </span>
                </div>
                <div className="text-[11px] text-[#7DD3FC] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span>{cap.telemetry.status}</span>
                </div>
              </div>

              {/* Feature Points Checklist */}
              <div className="pt-1 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                  Included In Store License
                </div>
                {cap.points.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-[#E2E8F0]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                    <span className="leading-snug">{point}</span>
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
                <span>Prev Tool</span>
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
                <span>{index === total - 1 ? 'Next Section' : 'Next Tool'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      }}
    />
  );
};
