import React, { useMemo, useState } from 'react';
import {
  Receipt,
  Boxes,
  Users,
  LayoutDashboard,
  BarChart3,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { UnifiedSpiralShowcase } from './UnifiedSpiralShowcase';
import type { SpiralDialItemDef } from './SpiralDialPanel';

type TabKey = 'pos' | 'inventory' | 'khata' | 'dashboard' | 'reports';

interface ProductModuleItem extends SpiralDialItemDef {
  id: TabKey;
  number: string;
  label: string;
  title: string;
  tagline: string;
  badge: string;
  icon: React.ElementType;
  headline: string;
  description: string;
}

const rawTabs = [
  {
    id: 'pos' as const,
    number: '01',
    label: 'Billing POS',
    badge: 'Sub-0.2s',
    icon: Receipt,
    headline: 'Express Optical Checkout',
    description: 'Instant barcode scanning, dynamic UPI QR code generation, and 1-click thermal printing.',
  },
  {
    id: 'inventory' as const,
    number: '02',
    label: 'Inventory',
    badge: 'Live Sync',
    icon: Boxes,
    headline: 'Real-Time Batch Control',
    description: 'Automatic stock deductions on every sale with proactive low-stock alerts and expiry monitoring.',
  },
  {
    id: 'khata' as const,
    number: '03',
    label: 'Khata CRM',
    badge: 'Zero-Paper',
    icon: Users,
    headline: 'Digital Customer Credit Book',
    description: 'Enforce safety credit limits and send automated WhatsApp payment reminders with UPI links.',
  },
  {
    id: 'dashboard' as const,
    number: '04',
    label: 'Dashboard',
    badge: 'Real-Time',
    icon: LayoutDashboard,
    headline: 'Live Store Command',
    description: 'Monitor daily sales revenue, net profit margins, completed bills, and active registers.',
  },
  {
    id: 'reports' as const,
    number: '05',
    label: 'Reports & GST',
    badge: '1-Click Export',
    icon: BarChart3,
    headline: 'Automated Tax & Z-Reports',
    description: 'Statutory GSTR-1 sales schedules, gross margin audits, and end-of-day register balancing.',
  },
];

export const ProductPreview: React.FC = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const tabItems: ProductModuleItem[] = useMemo(
    () =>
      rawTabs.map((t) => ({
        ...t,
        title: t.label,
        tagline: t.badge,
      })),
    []
  );

  return (
    <UnifiedSpiralShowcase
      sectionId="product"
      eyebrow="Interactive Console Preview"
      heading="Designed for speed at the counter."
      description="Inspect the real POS, inventory ledger, customer Khata book, owner cockpit, and GST export interface."
      items={tabItems}
      activeIndex={activeTabIndex}
      onActiveChange={setActiveTabIndex}
      dialLabel="Product '26"
      dialSublabel="POS Modules"
      prevLabel="Prev"
      nextLabel="Next"
      renderSimulator={(tab, { index, total, isActive, isInteractive, onPrev, onNext }) => (
        <div
          className="rounded-2xl border overflow-hidden flex flex-col justify-between h-full transition-colors duration-200"
          style={{
            backgroundColor: isActive ? '#0E1726' : '#09111E',
            borderColor: isActive ? 'rgba(56, 189, 248, 0.34)' : 'rgba(148, 163, 184, 0.2)',
            boxShadow: isActive
              ? '0 22px 48px -12px rgba(0, 0, 0, 0.72), 0 0 28px rgba(37, 99, 235, 0.18), inset 0 1px 0 rgba(186, 230, 253, 0.14)'
              : '0 14px 32px -12px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Window Header */}
          <div
            className="px-3.5 sm:px-4 py-2.5 border-b flex items-center justify-between gap-2 shrink-0"
            style={{
              backgroundColor: 'rgba(7, 11, 20, 0.72)',
              borderColor: 'rgba(56, 189, 248, 0.16)',
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 shrink-0" />
              <span className="ml-1 text-[11px] sm:text-xs font-mono font-bold text-[#E2E8F0] truncate">
                Ellic Enterprise · {tab.label}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-[10px] text-[#94A3B8] font-medium italic">
                Sample store data
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.22)',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  color: '#7DD3FC',
                }}
              >
                {tab.badge}
              </span>
            </div>
          </div>

          {/* Interactive Screen Simulation Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 scrollbar-thin">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {tab.headline}
              </h3>
              <p className="text-xs text-[#CBD5E1] mt-0.5 leading-relaxed">
                {tab.description}
              </p>
            </div>

            {/* MODULE 1: POS BILLING SCREEN */}
            {tab.id === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                <div
                  className="lg:col-span-7 p-3 rounded-xl border space-y-2"
                  style={{
                    backgroundColor: '#070B14',
                    borderColor: 'rgba(56, 189, 248, 0.2)',
                  }}
                >
                  <div
                    className="flex items-center justify-between text-xs font-bold text-[#E2E8F0] pb-1.5 border-b"
                    style={{ borderColor: 'rgba(148, 163, 184, 0.16)' }}
                  >
                    <span>Scanned Items (3)</span>
                    <span className="text-[#38BDF8] font-mono text-[11px]">Register #01</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { name: 'Basmati Rice 5kg', code: '8901234567890 • 1 unit', price: '₹480.00' },
                      { name: 'Organic Turmeric 500g', code: '8904567890123 • 2 units', price: '₹240.00' },
                      { name: 'Mustard Oil 1L', code: '8909876543210 • 1 unit', price: '₹160.00' },
                    ].map((row) => (
                      <div
                        key={row.code}
                        className="p-2 rounded-lg border flex justify-between items-center gap-2"
                        style={{
                          backgroundColor: '#0E1726',
                          borderColor: 'rgba(148, 163, 184, 0.16)',
                        }}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{row.name}</div>
                          <div className="text-[10px] text-[#94A3B8] font-mono truncate">{row.code}</div>
                        </div>
                        <div className="font-mono font-bold text-white shrink-0">{row.price}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="lg:col-span-5 p-3 rounded-xl border flex flex-col justify-between space-y-2.5"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderColor: 'rgba(56, 189, 248, 0.28)',
                  }}
                >
                  <div className="space-y-1 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                      Payment Settlement
                    </div>
                    <div className="flex justify-between text-[#94A3B8] text-[11px]">
                      <span>Subtotal</span>
                      <span className="font-mono font-semibold text-[#E2E8F0]">₹838.10</span>
                    </div>
                    <div className="flex justify-between text-[#94A3B8] text-[11px]">
                      <span>GST (5%)</span>
                      <span className="font-mono font-semibold text-[#E2E8F0]">₹41.90</span>
                    </div>
                    <div
                      className="flex justify-between text-sm font-bold text-white pt-1.5 border-t"
                      style={{ borderColor: 'rgba(56, 189, 248, 0.22)' }}
                    >
                      <span>Grand Total</span>
                      <span className="font-mono text-[#7DD3FC]">₹880.00</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full py-1.5 px-2 rounded-lg bg-[#2563EB] text-white font-bold text-[11px] text-center border border-[#38BDF8]/50">
                      Instant UPI QR (₹880)
                    </div>
                    <div className="flex gap-1.5">
                      <div
                        className="flex-1 py-1 rounded-lg border text-[10px] font-semibold text-[#CBD5E1] text-center"
                        style={{ backgroundColor: '#070B14', borderColor: 'rgba(148, 163, 184, 0.25)' }}
                      >
                        Cash (F1)
                      </div>
                      <div
                        className="flex-1 py-1 rounded-lg border text-[10px] font-semibold text-[#CBD5E1] text-center"
                        style={{ backgroundColor: '#070B14', borderColor: 'rgba(148, 163, 184, 0.25)' }}
                      >
                        Khata (F3)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 2: INVENTORY SCREEN */}
            {tab.id === 'inventory' && (
              <div
                className="p-3.5 rounded-xl border space-y-2.5"
                style={{ backgroundColor: '#070B14', borderColor: 'rgba(56, 189, 248, 0.2)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#E2E8F0]">Catalog SKUs (1,240 Total)</span>
                  <span className="text-[#38BDF8] font-semibold text-[11px]">Automatic FIFO decrements</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div
                    className="p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2"
                    style={{ backgroundColor: '#0E1726', borderColor: 'rgba(148, 163, 184, 0.16)' }}
                  >
                    <div>
                      <div className="font-bold text-white">Basmati Rice Superior 5kg</div>
                      <div className="text-[10px] text-[#94A3B8]">Batch #BT-902 · Expiry Dec 2027</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#E2E8F0]">41 units</span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.16)',
                          borderColor: 'rgba(52, 211, 153, 0.4)',
                          color: '#6EE7B7',
                        }}
                      >
                        In Stock
                      </span>
                    </div>
                  </div>
                  <div
                    className="p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2"
                    style={{ backgroundColor: '#0E1726', borderColor: 'rgba(148, 163, 184, 0.16)' }}
                  >
                    <div>
                      <div className="font-bold text-white">Whole Wheat Atta 10kg</div>
                      <div className="text-[10px] text-[#94A3B8]">Batch #BT-881 · Expiry Nov 2026</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#FBBF24] font-bold">4 units left</span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.16)',
                          borderColor: 'rgba(251, 191, 36, 0.4)',
                          color: '#FDE68A',
                        }}
                      >
                        Low Stock Alert
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 3: KHATA CRM SCREEN */}
            {tab.id === 'khata' && (
              <div
                className="p-3.5 rounded-xl border space-y-2.5"
                style={{ backgroundColor: '#070B14', borderColor: 'rgba(56, 189, 248, 0.2)' }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#E2E8F0]">Customer Credit Book (Khata)</span>
                  <span className="text-[#34D399] font-bold text-[11px]">100% Zero-Paper</span>
                </div>
                <div
                  className="p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs"
                  style={{ backgroundColor: '#0E1726', borderColor: 'rgba(148, 163, 184, 0.16)' }}
                >
                  <div>
                    <div className="font-bold text-white">Rahul Deshmukh</div>
                    <div className="text-[10px] text-[#94A3B8] font-mono">+91 98XXX XXXXX · Regular Customer</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="font-bold text-[#FB7185]">₹420.00 Due</div>
                      <div className="text-[10px] text-[#94A3B8] font-medium">Limit: ₹5,000</div>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold text-[11px] border border-[#38BDF8]/40">
                      WhatsApp Link
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 4: DASHBOARD SCREEN */}
            {tab.id === 'dashboard' && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {[
                  { label: "Today's Gross Revenue", value: '₹48,920', note: '+18.4% vs yday', tone: '#34D399' },
                  { label: 'Invoices Completed', value: '84 Bills', note: 'Avg ₹582 / bill', tone: '#38BDF8' },
                  { label: 'Gross Profit Margin', value: '25.4%', note: '₹12,425 profit', tone: '#34D399' },
                  { label: 'Active Registers', value: '2 Online', note: 'Cash balanced', tone: '#7DD3FC' },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="p-3 rounded-xl border space-y-1"
                    style={{ backgroundColor: '#070B14', borderColor: 'rgba(56, 189, 248, 0.2)' }}
                  >
                    <div className="text-[#94A3B8] text-[10px] font-medium">{metric.label}</div>
                    <div className="text-base sm:text-lg font-mono font-bold text-white">{metric.value}</div>
                    <div className="text-[10px] font-semibold" style={{ color: metric.tone }}>
                      {metric.note}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODULE 5: REPORTS & GST SCREEN */}
            {tab.id === 'reports' && (
              <div
                className="p-3.5 rounded-xl border space-y-2.5 text-xs"
                style={{ backgroundColor: '#070B14', borderColor: 'rgba(56, 189, 248, 0.2)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E2E8F0]">Statutory Tax & Day-End Summaries</span>
                  <span className="text-[#38BDF8] font-semibold text-[11px]">GSTR-1 Ready</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    className="p-2.5 rounded-lg border"
                    style={{ backgroundColor: '#0E1726', borderColor: 'rgba(148, 163, 184, 0.16)' }}
                  >
                    <div className="text-[#94A3B8] text-[10px]">CGST + SGST</div>
                    <div className="text-sm font-mono font-bold text-white mt-0.5">₹2,329.50</div>
                  </div>
                  <div
                    className="p-2.5 rounded-lg border"
                    style={{ backgroundColor: '#0E1726', borderColor: 'rgba(148, 163, 184, 0.16)' }}
                  >
                    <div className="text-[#94A3B8] text-[10px]">Shift Z-Report</div>
                    <div className="text-sm font-bold text-[#34D399] mt-0.5">Balanced</div>
                  </div>
                  <div
                    className="p-2.5 rounded-lg border"
                    style={{ backgroundColor: '#0E1726', borderColor: 'rgba(148, 163, 184, 0.16)' }}
                  >
                    <div className="text-[#94A3B8] text-[10px]">Portal Export</div>
                    <div className="text-sm font-bold text-[#38BDF8] mt-0.5">CSV / PDF</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation Controls */}
          <div
            className="px-4 py-2.5 border-t flex items-center justify-between gap-2 text-xs shrink-0"
            style={{
              backgroundColor: 'rgba(7, 11, 20, 0.72)',
              borderColor: 'rgba(56, 189, 248, 0.16)',
            }}
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
              <span>Prev</span>
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
              <span>{index === total - 1 ? 'Next Section' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    />
  );
};
