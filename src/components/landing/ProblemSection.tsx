import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const problems = [
  {
    pain: 'Paper Khata & Lost Credit',
    painDesc: 'Customer dues recorded in paper diaries get forgotten, disputed, or lost over time.',
    solution: 'Digital Khata with instant WhatsApp balance reminders and direct UPI payment links.',
  },
  {
    pain: 'Blind Stock Discrepancies',
    painDesc: 'The billing machine doesn’t talk to the stockroom. Shelves run empty without warning.',
    solution: 'Live inventory deduction on every barcode scan with automated low-stock reorder alerts.',
  },
  {
    pain: 'Slow Counter Queues',
    painDesc: 'Clunky POS software freezes during evening rush, causing frustrated shoppers to walk away.',
    solution: 'Sub-second optical barcode checkout that runs smoothly even when internet drops.',
  },
  {
    pain: 'Late-Night Spreadsheet Clutter',
    painDesc: 'Shop owners spend hours after closing manually tallying drawer cash, bills, and GST sheets.',
    solution: 'Single-click day-end Z-reports and export-ready GST summaries generated in real time.',
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
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest text-blue-600 dark:text-sky-400 uppercase select-none mb-2.5 sm:mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
            <span>The Retail Reality</span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-slate-600 dark:text-slate-400 font-semibold normal-case tracking-normal">
              Why Stores Switch
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight break-words">
            Stop running your shop across 4 disconnected tools.
          </h2>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Local retail shouldn’t require juggling paper notebooks, separate billing machines, and manual spreadsheets.
          </p>
        </div>

        {/* 4 Contrast Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {problems.map((item, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-700 shadow-md hover:border-blue-500/80 dark:hover:border-sky-500/50 transition-all space-y-4"
            >
              {/* Problem (The Old Way) */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border-2 border-rose-400/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-0.5">
                    The Problem
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {item.pain}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.painDesc}
                  </p>
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex items-center gap-2 pl-2 sm:pl-3 text-slate-500 dark:text-slate-400 text-xs">
                <div className="h-0.5 flex-1 bg-slate-300 dark:bg-slate-700" />
                <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-sky-400 flex items-center gap-1">
                  How Ellic fixes it <ArrowRight className="w-3 h-3" />
                </span>
                <div className="h-0.5 flex-1 bg-slate-300 dark:bg-slate-700" />
              </div>

              {/* Solution (The Ellic Way) */}
              <div className="flex items-start gap-3 bg-sky-50 dark:bg-blue-950/40 p-3.5 sm:p-4 rounded-xl border-2 border-sky-400 dark:border-sky-800 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-600/15 dark:bg-sky-500/15 border-2 border-blue-500/40 dark:border-sky-400/40 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {item.solution}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
