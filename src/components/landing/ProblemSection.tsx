import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const problems = [
  {
    pain: 'Paper Khata & Lost Credit',
    consequence: 'Handwritten slips get misplaced, payment dates slip without reminders, and customer disputes turn into unrecoverable bad debts (averaging 3-7% revenue loss).',
    solution: 'Digital Khata ledger with automated WhatsApp payment nudges, integrated UPI QR links, and itemized transaction receipts.',
    outcome: '94% faster credit collection, zero lost records, and full customer dispute resolution with signed digital audit trails.',
  },
  {
    pain: 'Blind Stock Discrepancies',
    consequence: 'Billing systems operate disconnected from the storeroom. Fast-moving SKUs run out unnoticed on busy evenings while capital stays trapped in dead stock.',
    solution: 'Real-time multi-location inventory deduction on every barcode scan, with predictive low-stock reorder thresholds and supplier PO automation.',
    outcome: 'Eliminates unannounced stockouts, cuts holding costs by 18%, and delivers 100% item-level inventory accuracy across every shelf.',
  },
  {
    pain: 'Slow Counter Queues',
    consequence: 'Clunky POS interfaces freeze during evening peak hours, causing 10-minute wait lines and cart abandonment from impatient shoppers.',
    solution: 'Sub-second optical barcode engine with keyboard-driven fast keys, split cash/UPI tenders, and full offline resilience when the local internet drops.',
    outcome: 'Under 1.2 seconds per customer scan-to-receipt, eliminating counter bottlenecks and serving up to 3x more customers during peak rushes.',
  },
  {
    pain: 'Late-Night Spreadsheet Clutter',
    consequence: 'Shop owners spend 2 to 3 exhausting hours after shuttering manually cross-checking physical cash drawers, card slips, and filing GSTR-1 summaries.',
    solution: 'Single-click day-end Z-reports, automated cash-reconciliation variance alerts, and export-ready GST summaries formatted for direct portal filing.',
    outcome: 'Closes store accounts in under 5 minutes, eliminates manual arithmetic discrepancies, and reduces CA filing prep time to zero.',
  },
];

export const ProblemSection: React.FC = () => {
  return (
    <section
      id="problem"
      className="py-12 sm:py-16 md:py-24 bg-[#E2E8F0] dark:bg-slate-900/50 border-y-2 border-slate-300 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest text-blue-600 dark:text-sky-400 uppercase select-none mb-2.5 sm:mb-3">
            <span className="w-3.5 h-[1.5px] bg-blue-600 dark:bg-sky-400" />
            <span>The Retail Reality</span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-slate-600 dark:text-slate-400 font-semibold normal-case tracking-normal">
              Why Stores Switch
            </span>
          </div>
          <h2
            style={{ textWrap: 'balance' }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight break-words"
          >
            Stop running your shop across 4 disconnected tools.
          </h2>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Local retail shouldn’t require juggling paper notebooks, separate billing machines, and manual spreadsheets. Here is how Ellic transforms daily store operations:
          </p>
        </div>

        {/* 4 Detailed Multi-Facet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {problems.map((item, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-md hover:border-blue-500/70 dark:hover:border-sky-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Problem & Operational Consequence */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-300/60 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      The Retail Pain Point
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                      {item.pain}
                    </h3>
                  </div>
                </div>

                <div className="pl-11 pr-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-rose-500/5 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-200/80 dark:border-rose-900/40">
                  <span className="font-semibold text-rose-700 dark:text-rose-300">Operational Consequence: </span>
                  {item.consequence}
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex items-center gap-2 pl-2 sm:pl-3 text-slate-500 dark:text-slate-400 text-xs my-1">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-sky-400 flex items-center gap-1">
                  How Ellic Solves It <ArrowRight className="w-3 h-3" />
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Solution & Practical Outcome */}
              <div className="space-y-2.5 bg-sky-50/70 dark:bg-blue-950/40 p-4 rounded-xl border border-sky-300/70 dark:border-sky-800 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-600/15 dark:bg-sky-500/15 border border-blue-500/35 dark:border-sky-400/35 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-300">
                      Ellic Capability
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug mt-0.5">
                      {item.solution}
                    </p>
                  </div>
                </div>

                <div className="pl-8 pt-1.5 text-xs text-blue-800 dark:text-sky-200 border-t border-sky-200/80 dark:border-sky-800/60 font-medium">
                  <span className="font-bold text-blue-700 dark:text-sky-300">Measurable Outcome: </span>
                  {item.outcome}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
