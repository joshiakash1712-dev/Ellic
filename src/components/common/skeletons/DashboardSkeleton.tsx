import React from 'react';
import { Skeleton } from './SkeletonBase';
import { useStore } from '../../../context/StoreContext';
import { Store as StoreIcon, Loader2 } from 'lucide-react';

export const DashboardSkeleton: React.FC = () => {
  const { activeStore } = useStore();

  return (
    <div
      id="dashboard-skeleton-view"
      className="space-y-5 w-full min-w-0 pb-10"
      aria-busy="true"
      aria-label="Loading Dashboard Data"
    >
      {/* Active Store Loading Banner */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <StoreIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="font-extrabold text-white flex items-center gap-2 truncate">
              <span className="truncate">{activeStore?.name || 'Active Store'}</span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                Active Store
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">Loading fresh store metrics, inventory & ledger data...</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-semibold shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">Loading store...</span>
        </div>
      </div>
      {/* 1. Hero Store Status Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Hero */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl glass-panel shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden">
          <div className="space-y-3 z-10">
            <div className="space-y-2">
              <Skeleton className="h-8 w-56 sm:w-72" />
              <Skeleton className="h-4 w-72 sm:w-96 max-w-full" />
            </div>
            {/* Quick Action Buttons Placeholder */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Hero: Store Location & Sync */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl glass-panel shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/50 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/50 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* 2A. Four Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl glass-panel shadow-lg flex flex-col justify-between gap-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <Skeleton variant="circular" className="w-8 h-8" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5 mt-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* 2B. Five Operational Indicator Strip Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 ${
              idx === 5 ? 'col-span-2 md:col-span-1' : ''
            }`}
          >
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton variant="circular" className="w-4 h-4 shrink-0" />
          </div>
        ))}
      </div>

      {/* 3. Main Analytics & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Weekly Sales Chart & Live Activity Feed */}
        <div className="lg:col-span-8 space-y-5">
          {/* Revenue Velocity Chart Card */}
          <div className="p-5 sm:p-6 rounded-2xl glass-panel shadow-xl space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-60" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>

            {/* Simulated Chart Bars */}
            <div className="h-56 w-full pt-6 flex items-end justify-between gap-3 sm:gap-6 px-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
              {[45, 70, 30, 85, 60, 95, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full max-w-[38px] bg-slate-200/80 dark:bg-slate-800/70 rounded-t-lg animate-pulse"
                    style={{ height: `${h}%` }}
                  />
                  <Skeleton className="h-2.5 w-6" />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-40" />
            </div>
          </div>

          {/* Live Recent Transactions Feed */}
          <div className="p-5 sm:p-6 rounded-2xl glass-panel shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rounded" className="w-9 h-9 rounded-lg shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-36" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-2.5 w-14 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Top Selling Products & Inventory Health */}
        <div className="lg:col-span-4 space-y-5">
          {/* Top Selling Products Card */}
          <div className="p-5 sm:p-6 rounded-2xl glass-panel shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="space-y-3.5">
              {[1, 2, 3, 4].map((p) => (
                <div key={p} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton variant="circular" className="w-5 h-5 shrink-0" />
                      <Skeleton className="h-3.5 w-32" />
                    </div>
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Health Snapshot */}
          <div className="p-5 sm:p-6 rounded-2xl glass-panel shadow-xl space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="flex items-center justify-center py-4">
              <Skeleton variant="circular" className="w-28 h-28" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
              <div className="p-2 rounded-lg bg-slate-100/50 dark:bg-slate-900/40 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="p-2 rounded-lg bg-slate-100/50 dark:bg-slate-900/40 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
