import React, { useState } from 'react';
import {
  Receipt,
  Boxes,
  Users,
  LayoutDashboard,
  BarChart3,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MousePointer,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { WorkWheelStage } from './WorkWheelStage';
import { useCardWheelScroll } from '../../hooks/useCardWheelScroll';

type TabKey = 'pos' | 'inventory' | 'khata' | 'dashboard' | 'reports';

interface TabItem {
  id: TabKey;
  number: string;
  label: string;
  badge: string;
  icon: React.ElementType;
  headline: string;
  description: string;
}

const tabs: TabItem[] = [
  {
    id: 'pos',
    number: '01',
    label: 'Billing POS',
    badge: 'Sub-0.2s',
    icon: Receipt,
    headline: 'Express Optical Checkout',
    description: 'Instant barcode scanning, dynamic UPI QR code generation, and 1-click thermal printing.',
  },
  {
    id: 'inventory',
    number: '02',
    label: 'Inventory',
    badge: 'Live Sync',
    icon: Boxes,
    headline: 'Real-Time Batch Control',
    description: 'Automatic stock deductions on every sale with proactive low-stock alerts and expiry monitoring.',
  },
  {
    id: 'khata',
    number: '03',
    label: 'Khata CRM',
    badge: 'Zero-Paper',
    icon: Users,
    headline: 'Digital Customer Credit Book',
    description: 'Enforce safety credit limits and send automated WhatsApp payment reminders with UPI links.',
  },
  {
    id: 'dashboard',
    number: '04',
    label: 'Dashboard',
    badge: 'Real-Time',
    icon: LayoutDashboard,
    headline: 'Live Store Command',
    description: 'Monitor daily sales revenue, net profit margins, completed bills, and active registers.',
  },
  {
    id: 'reports',
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
  const prefersReducedMotion = useReducedMotion();

  const activeTabMeta = tabs[activeTabIndex] || tabs[0];
  const activeTab = activeTabMeta.id;

  const handleTabSelect = React.useCallback((idx: number) => {
    setActiveTabIndex(idx);
  }, []);

  // Work wheel scrolling with screen centering and page-lock until last card
  const {
    sectionRef,
    cardRef,
    scrollProps,
    isLastItem,
    scrollToNextSection,
  } = useCardWheelScroll({
    totalItems: tabs.length,
    activeIndex: activeTabIndex,
    onActiveChange: setActiveTabIndex,
    sectionId: 'product',
  });

  return (
    <section
      ref={sectionRef}
      id="product"
      data-work-wheel="true"
      className="py-6 sm:py-8 lg:py-10 scroll-mt-20 bg-slate-50/70 dark:bg-slate-950 border-b-2 border-slate-200 dark:border-slate-800 transition-colors overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-4 sm:mb-6 lg:mb-7">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Designed for speed at the counter.
          </h2>
        </div>

        {/* Side-by-Side: Interactive Work Wheel on Left, Live Scrolling UI Simulator on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-stretch">
          
          {/* Left: Vector Work Wheel Dial Component (Hidden on mobile for clean preview, visible on desktop) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-6 flex-col">
            <WorkWheelStage
              items={tabs.map((t) => ({
                id: t.id,
                number: t.number,
                title: t.label,
                tagline: t.badge,
                icon: t.icon,
              }))}
              activeIndex={activeTabIndex}
              onActiveChange={handleTabSelect}
              label="Product '26"
              sublabel="POS Modules"
              className="h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]"
            />
          </div>

          {/* Right: Live Interactive UI Simulator Window (Target Card with Work Wheel scrolling applied) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
            <div
              ref={cardRef}
              {...scrollProps}
              className="rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col justify-between h-full outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-grab active:cursor-grabbing"
            >
              {/* Window Header */}
              <div className="bg-slate-100/95 dark:bg-slate-800/90 border-b-2 border-slate-200 dark:border-slate-700 px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="ml-1 text-[11px] sm:text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
                    Ellic Enterprise • {activeTabMeta.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold px-2 sm:px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 border-2 border-blue-200 dark:border-blue-900 shrink-0 whitespace-nowrap">
                    {activeTabMeta.badge}
                  </span>
                </div>
              </div>

              {/* Module Simulator Content with internal scroll safeguard */}
              <div className="flex-1 overflow-y-auto max-h-[min(480px,calc(100dvh-15.5rem))] p-3.5 sm:p-4 md:p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                          {activeTabMeta.headline}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          {activeTabMeta.description}
                        </p>
                      </div>

                      {/* TAB 1: POS BILLING SCREEN */}
                      {activeTab === 'pos' && (
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-7 bg-slate-100/70 dark:bg-slate-950 p-3 sm:p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pb-1.5 border-b-2 border-slate-200 dark:border-slate-800">
                              <span>Scanned Items (3)</span>
                              <span className="text-blue-600 dark:text-sky-400 font-mono text-[11px] font-bold">Register #01</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">Basmati Rice 5kg</div>
                                  <div className="text-[10px] text-slate-500 font-mono">8901234567890 • 1 unit</div>
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white">₹480.00</div>
                              </div>
                              <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">Organic Turmeric 500g</div>
                                  <div className="text-[10px] text-slate-500 font-mono">8904567890123 • 2 units</div>
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white">₹240.00</div>
                              </div>
                              <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">Mustard Oil 1L</div>
                                  <div className="text-[10px] text-slate-500 font-mono">8909876543210 • 1 unit</div>
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white">₹160.00</div>
                              </div>
                            </div>
                          </div>

                          <div className="sm:col-span-5 bg-sky-50 dark:bg-blue-950/20 p-3 sm:p-3.5 rounded-xl border-2 border-sky-300 dark:border-blue-900/60 flex flex-col justify-between space-y-3 shadow-2xs">
                            <div className="space-y-1 text-xs">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-400">
                                Payment Settlement
                              </div>
                              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                                <span>Subtotal</span>
                                <span className="font-semibold">₹838.10</span>
                              </div>
                              <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                                <span>GST (5%)</span>
                                <span className="font-semibold">₹41.90</span>
                              </div>
                              <div className="flex justify-between text-sm font-bold text-slate-950 dark:text-white pt-1.5 border-t-2 border-sky-200 dark:border-blue-800">
                                <span>Grand Total</span>
                                <span className="text-blue-700 dark:text-sky-300">₹880.00</span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="w-full py-2 px-2.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-md text-center border border-blue-700">
                                Instant UPI QR (₹880)
                              </div>
                              <div className="flex gap-1.5">
                                <div className="flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 text-center">
                                  Cash (F1)
                                </div>
                                <div className="flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-800 dark:text-slate-200 text-center">
                                  Khata (F3)
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: INVENTORY SCREEN */}
                      {activeTab === 'inventory' && (
                        <div className="bg-slate-100/70 dark:bg-slate-950 p-3.5 sm:p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Catalog SKUs (1,240 Total)</span>
                            <span className="text-sky-600 dark:text-sky-400 font-semibold text-[11px]">Automatic FIFO decrements</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">Basmati Rice Superior 5kg</div>
                                <div className="text-[10px] text-slate-500">Batch #BT-902 • Expiry Dec 2027</div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">41 units</span>
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  In Stock
                                </span>
                              </div>
                            </div>
                            <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">Whole Wheat Atta 10kg</div>
                                <div className="text-[10px] text-slate-500">Batch #BT-881 • Expiry Nov 2026</div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">4 units left</span>
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  Low Stock Alert
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: KHATA CRM SCREEN */}
                      {activeTab === 'khata' && (
                        <div className="bg-slate-100/70 dark:bg-slate-950 p-3.5 sm:p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Customer Credit Book (Khata)</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">100% Zero-Paper</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">Rahul Deshmukh</div>
                                <div className="text-[10px] text-slate-500">+91 98765 43210 • Regular Customer</div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <div className="text-right">
                                  <div className="font-bold text-rose-600 dark:text-rose-400">₹420.00 Due</div>
                                  <div className="text-[10px] text-slate-500 font-medium">Limit: ₹5,000</div>
                                </div>
                                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shadow-sm">
                                  WhatsApp Link
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: DASHBOARD SCREEN */}
                      {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">Today’s Gross Revenue</div>
                            <div className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">₹48,920</div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">+18.4% vs yday</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">Invoices Completed</div>
                            <div className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">84 Bills</div>
                            <div className="text-[10px] text-blue-700 dark:text-sky-400 font-semibold">Avg ₹582 / bill</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">Gross Profit Margin</div>
                            <div className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">25.4%</div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">₹12,425 profit</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div className="text-slate-600 dark:text-slate-400 text-[10px] font-medium">Active Registers</div>
                            <div className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">2 Online</div>
                            <div className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold">Cash balanced</div>
                          </div>
                        </div>
                      )}

                      {/* TAB 5: REPORTS & GST SCREEN */}
                      {activeTab === 'reports' && (
                        <div className="bg-slate-100/70 dark:bg-slate-950 p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">Statutory Tax & Day-End Summaries</span>
                            <span className="text-blue-600 dark:text-sky-400 font-semibold text-[11px]">GSTR-1 Ready</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xs">
                              <div className="text-slate-500 text-[10px]">CGST + SGST</div>
                              <div className="text-sm font-bold text-slate-950 dark:text-white mt-0.5">₹2,329.50</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xs">
                              <div className="text-slate-500 text-[10px]">Shift Z-Report</div>
                              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Balanced</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xs">
                              <div className="text-slate-500 text-[10px]">Portal Export</div>
                              <div className="text-sm font-bold text-blue-600 dark:text-sky-400 mt-0.5">CSV / PDF</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

              {/* Bottom Card Controls & Footer */}
              <div className="px-4 py-2.5 border-t-2 border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-500 bg-slate-100/60 dark:bg-slate-950/40 shrink-0">
                <button
                  type="button"
                  disabled={activeTabIndex === 0}
                  onClick={() => handleTabSelect(Math.max(0, activeTabIndex - 1))}
                  className="px-3 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="text-[11px] font-mono font-medium text-slate-500">
                  {activeTabIndex + 1} / {tabs.length}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeTabIndex < tabs.length - 1) {
                      handleTabSelect(activeTabIndex + 1);
                    } else {
                      scrollToNextSection();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition-colors border border-blue-700"
                >
                  <span>{activeTabIndex === tabs.length - 1 ? 'Next Section' : 'Next'}</span>
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
