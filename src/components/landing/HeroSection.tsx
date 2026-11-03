import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  TrendingUp,
  Package,
  Users,
  CreditCard,
  QrCode,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

interface HeroSectionProps {
  onOpenGetStarted?: () => void;
  onLaunchApp?: () => void;
  onOpenGuide?: (step?: number) => void;
  guideProgressStep?: number;
  guideCompleted?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenGetStarted,
  onLaunchApp,
  onOpenGuide,
  guideProgressStep = 0,
  guideCompleted = false,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState<'pos' | 'inventory' | 'finance'>('pos');

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const gridY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? ['0%', '0%'] : ['0%', '18%']);
  const ambientOrbPrimaryY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? ['0%', '0%'] : ['0%', '28%']);
  const ambientOrbSecondaryY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? ['0%', '0%'] : ['0%', '-20%']);
  const ambientOrbScale = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [1, 1] : [1, 1.08]);
  const mockupBackingY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 28]);

  const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50/70 to-slate-100 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 transition-colors"
    >
      {/* Subtle Background Structural Grid with Gentle Scroll Parallax */}
      <motion.div
        style={{ y: gridY }}
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 dark:opacity-20 pointer-events-none will-change-transform"
      />

      {/* Atmospheric Orbital Data Traces along the Hero Grid (Section 4) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-sky-400/20 to-transparent overflow-hidden pointer-events-none"
      >
        <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent ellix-signal-trace" />
      </div>

      {/* Parallax Ambient Background Radial Glows with Slow Atmospheric Drift */}
      <motion.div
        style={{ y: ambientOrbPrimaryY, scale: ambientOrbScale }}
        aria-hidden="true"
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[22rem] rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-3xl pointer-events-none will-change-transform ellix-ambient-drift"
      />
      <motion.div
        style={{ y: ambientOrbSecondaryY }}
        aria-hidden="true"
        className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-sky-500/8 dark:bg-sky-500/10 blur-3xl pointer-events-none will-change-transform"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Copy & Headlines — Page Load Entrance Sequence (Section 3 & 5) */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* 1. Platform Kicker — Zero-Pill Editorial Discipline */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: smoothEase, delay: 0.04 }}
            className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest text-blue-600 dark:text-sky-400 uppercase select-none text-center"
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 dark:bg-sky-400 shadow-[0_0_8px_rgba(37,99,235,0.7)] animate-pulse shrink-0" />
            <span>Retail &amp; Commerce Operating System</span>
          </motion.div>

          {/* 2. Large Headline — Blur-to-sharp entrance motion with balanced typography */}
          <motion.h1
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 18, filter: 'blur(6px)' }
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: smoothEase, delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-[1.18] sm:leading-[1.12] break-words"
          >
            Run your store operations. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-sky-400 bg-clip-text text-transparent">
              Without the complexity.
            </span>
          </motion.h1>

          {/* 3. Supporting Explanatory Paragraph */}
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: smoothEase, delay: 0.18 }}
            className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto"
          >
            Ellic brings billing, inventory, customer khata, payments, and multi-batch stock control into one seamless platform built specifically for growing merchants and retail teams.
          </motion.p>

          {/* 4. Primary & Secondary CTA Action Buttons */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, ease: smoothEase, delay: 0.25 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full"
          >
            <button
              id="btn-hero-getstarted"
              type="button"
              data-cursor="hover"
              data-magnetic="cta"
              onClick={onOpenGetStarted}
              className="website-btn-glow w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-black dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-base font-semibold shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 text-sky-400 dark:text-sky-100 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            <a
              id="btn-hero-seehowitworks"
              href="#problem"
              data-cursor="hover"
              data-magnetic="cta"
              className="website-btn-glow w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 text-slate-800 dark:text-slate-200 text-base font-semibold border border-slate-300 dark:border-slate-700 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <Play className="w-4 h-4 text-slate-600 dark:text-slate-400 fill-slate-600 dark:fill-slate-400 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-all duration-200" />
              <span>See How It Works</span>
            </a>
          </motion.div>

          {/* 5. Trust Value Props */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: smoothEase, delay: 0.32 }}
            className="pt-3 sm:pt-4 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" /> No complex setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" /> Works on any device
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" /> Instant digital bills
            </span>
          </motion.div>

        </div>

        {/* 6. Polished Visual Application Mockup — Enters slightly after main content */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.68, ease: smoothEase, delay: 0.36 }}
          className="mt-12 sm:mt-16 relative mx-auto max-w-5xl"
        >
          
          {/* Subtle Ambient Backing Glow */}
          <motion.div
            style={{ y: mockupBackingY }}
            aria-hidden="true"
            className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-blue-500/15 via-slate-200 to-slate-100 dark:from-blue-500/15 dark:via-slate-800 dark:to-slate-900 opacity-85 blur-xl -z-10 will-change-transform"
          />

          {/* App Window Frame */}
          <div className="rounded-2xl border-2 border-slate-400 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transition-colors">
            
            {/* macOS / SaaS Window Header */}
            <div className="bg-slate-200/90 dark:bg-slate-800/90 border-b-2 border-slate-300 dark:border-slate-700 px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-400 shrink-0" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 shrink-0" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sky-400 shrink-0" />
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-2 hidden sm:block" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  Ellic POS
                </span>
              </div>

              {/* Interactive Workspace Mode Segmented Control */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-200/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold w-full sm:w-auto justify-between sm:justify-center">
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceMode('pos')}
                  className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 rounded-md transition-all cursor-pointer text-center text-[11px] sm:text-xs truncate ${
                    activeWorkspaceMode === 'pos'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  POS Register
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceMode('inventory')}
                  className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 rounded-md transition-all cursor-pointer text-center text-[11px] sm:text-xs truncate ${
                    activeWorkspaceMode === 'inventory'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Live Stock
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceMode('finance')}
                  className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 rounded-md transition-all cursor-pointer text-center text-[11px] sm:text-xs truncate ${
                    activeWorkspaceMode === 'finance'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Margins &amp; Tax
                </button>
              </div>

              {/* Interactive Launch Button (Tablet/Desktop) */}
              <div className="hidden sm:flex items-center gap-2.5 sm:gap-3 shrink-0">
                {onLaunchApp && (
                  <button
                    id="btn-hero-try-live-console"
                    type="button"
                    data-cursor="hover"
                    data-magnetic="cta"
                    onClick={onLaunchApp}
                    className="website-btn-glow flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all shadow-sm hover:shadow-blue-500/30 cursor-pointer group whitespace-nowrap shrink-0"
                  >
                    <span>Launch Live Demo</span>
                    <ArrowRight className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Inner Dashboard & POS Workspace Mockup (Soft slate background so cards stand out) */}
            <div className="p-3 sm:p-6 bg-[#E2E8F0] dark:bg-slate-950/50 space-y-3.5 sm:space-y-5 border-t-2 border-slate-300 dark:border-slate-800">
              
              {/* Dynamic Quick Stats Row according to activeWorkspaceMode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                {activeWorkspaceMode === 'pos' && (
                  <>
                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-400 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/80 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Today&apos;s Sales</span>
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">₹42,850</div>
                      <div className="text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-0.5 truncate">+16.4% from yesterday</div>
                    </div>

                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-400 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/80 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Invoices Issued</span>
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 group-hover:-translate-y-0.5 transition-transform duration-200 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">38 Bills</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Avg. ₹1,127 / bill</div>
                    </div>

                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-400 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/80 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Cash in Drawer</span>
                        <CreditCard className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 group-hover:scale-105 transition-transform duration-200 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">₹14,600</div>
                      <div className="text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-0.5 truncate">Reconciled &amp; balanced</div>
                    </div>
                  </>
                )}

                {activeWorkspaceMode === 'inventory' && (
                  <>
                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Total SKUs</span>
                        <Package className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">248 items</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Across 8 categories</div>
                    </div>

                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Stock Valuation</span>
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">₹4,82,400</div>
                      <div className="text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-0.5 truncate">FIFO purchase cost</div>
                    </div>

                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Reorder Triggers</span>
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-amber-500 tabular-nums truncate">2 Low Items</div>
                      <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">Automatic draft ready</div>
                    </div>

                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Batch Shield</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">0 Expired</div>
                      <div className="text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-0.5 truncate">Zero dead inventory</div>
                    </div>
                  </>
                )}

                {activeWorkspaceMode === 'finance' && (
                  <>
                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Gross Revenue</span>
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">₹42,850</div>
                      <div className="text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-0.5 truncate">38 Invoices settled</div>
                    </div>

                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Net Margin</span>
                        <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">₹11,920</div>
                      <div className="text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-0.5 truncate">27.8% Realized margin</div>
                    </div>

                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Tax Output</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">₹2,040</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">CGST + SGST (5%)</div>
                    </div>

                    <div className="website-card-hover bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm cursor-default group min-w-0 hover:border-blue-500/50 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 gap-1">
                        <span className="text-[11px] sm:text-xs font-semibold truncate">Settlement Split</span>
                        <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                      </div>
                      <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums truncate">66% Digital</div>
                      <div className="text-[10px] sm:text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-0.5 truncate">UPI + Cash settled</div>
                    </div>
                  </>
                )}
              </div>

              {/* Main Workstage Split according to activeWorkspaceMode */}
              {activeWorkspaceMode === 'pos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative animate-in fade-in duration-200">
                  {/* Active Billing Terminal */}
                  <div className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-400 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-colors">
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b-2 border-slate-300 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <span className="relative flex h-2.5 w-2.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 dark:bg-sky-500" />
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide truncate">
                            Live Counter · POS #1042
                          </span>
                        </div>
                        <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 whitespace-nowrap shrink-0">
                          <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" /> Just now
                        </span>
                      </div>

                      {/* Customer Info Chip */}
                      <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-2.5 sm:p-3 mb-3 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-between gap-2 text-xs transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                          <div className="min-w-0 truncate">
                            <span className="font-bold text-slate-900 dark:text-white">Rajesh Verma</span>
                            <span className="text-slate-500 dark:text-slate-400 ml-1.5 hidden xs:inline font-mono">(+91 98450 11223)</span>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 dark:text-sky-300 bg-sky-100 dark:bg-blue-950/80 border-2 border-sky-400 dark:border-sky-800 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                          120 Pts
                        </span>
                      </div>

                      {/* Itemized Cart List with clearly framed box rows */}
                      <div className="space-y-2 sm:space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs py-2.5 sm:py-3 px-3 sm:px-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border-2 border-slate-300 dark:border-slate-700/80 hover:border-blue-500/80 hover:bg-white dark:hover:bg-slate-800 shadow-2xs transition-all">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">Royal Basmati Rice 5kg</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">SKU: GRO-8821 · GST 5%</div>
                          </div>
                          <div className="text-right tabular-nums shrink-0">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">₹540.00</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">1 unit</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs py-2.5 sm:py-3 px-3 sm:px-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border-2 border-slate-300 dark:border-slate-700/80 hover:border-blue-500/80 hover:bg-white dark:hover:bg-slate-800 shadow-2xs transition-all">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">Cold Pressed Groundnut Oil 1L</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">SKU: OIL-4102 · GST 5%</div>
                          </div>
                          <div className="text-right tabular-nums shrink-0">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">₹320.00</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">1 unit</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs py-2.5 sm:py-3 px-3 sm:px-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border-2 border-slate-300 dark:border-slate-700/80 hover:border-blue-500/80 hover:bg-white dark:hover:bg-slate-800 shadow-2xs transition-all">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">Organic Roasted Almonds 250g</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">SKU: NUT-0914 · GST 12%</div>
                          </div>
                          <div className="text-right tabular-nums shrink-0">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">₹260.00</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">1 unit</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bill Total & Instant Actions */}
                    <div className="pt-3 sm:pt-4 mt-3 border-t-2 border-slate-300 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold">Grand Total (Incl. GST)</span>
                        <span className="text-lg sm:text-xl font-extrabold text-slate-950 dark:text-white tabular-nums shrink-0">₹1,120.00</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs">
                        <div className="py-2.5 px-2 text-center font-bold bg-sky-100 dark:bg-blue-950/70 text-blue-800 dark:text-sky-300 rounded-xl border-2 border-sky-500 dark:border-sky-700 shadow-2xs flex items-center justify-center leading-tight">
                          ✓ UPI Paid
                        </div>
                        <div className="py-2.5 px-2 text-center font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border-2 border-slate-400 dark:border-slate-700 shadow-2xs flex items-center justify-center leading-tight">
                          WhatsApp Sent
                        </div>
                        <div className="py-2.5 px-2 text-center font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border-2 border-slate-400 dark:border-slate-700 shadow-2xs flex items-center justify-center leading-tight">
                          Stock Deducted
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkspaceMode === 'inventory' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative animate-in fade-in duration-200">
                  {/* Left: Active Stock Audit Terminal */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                            Live SKU Tracker · Batch Control
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-blue-600 dark:text-sky-400 bg-sky-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border-2 border-sky-300 dark:border-sky-800 font-bold">
                          248 Active SKUs
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/80 shadow-2xs">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Royal Basmati Rice 5kg</div>
                            <div className="text-[10px] text-slate-500">Batch: B-2026A · Exp: Nov 2027</div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400 border-2 border-sky-300 dark:border-sky-500/30">
                              ✓ 142 In Stock
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-500/30 shadow-2xs">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Cold Pressed Groundnut Oil 1L</div>
                            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Reorder Threshold: 10 units</div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 border-2 border-amber-400 dark:border-amber-500/30">
                              ⚠ 8 Left (Low)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/80 shadow-2xs">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">Organic Roasted Almonds 250g</div>
                            <div className="text-[10px] text-slate-500">Batch: B-8810 · Exp: Aug 2027</div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-400 border-2 border-sky-300 dark:border-sky-500/30">
                              ✓ 34 In Stock
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t-2 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Automated Restock Status:</span>
                      <span className="font-bold text-blue-600 dark:text-sky-400">PO Draft Generated for Supplier</span>
                    </div>
                  </div>

                  {/* Right: Supplier & Reorder Trigger */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                          <span>Supplier Auto-Restock</span>
                        </span>
                        <span className="text-[11px] font-mono text-blue-600 dark:text-sky-400 font-bold">1-Tap PO</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-300 dark:border-slate-700 space-y-2 text-xs shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 dark:text-white">AgroPulse Wholesaler</span>
                          <span className="text-[10px] text-blue-600 dark:text-sky-400 font-mono font-bold">PO #9042</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          Automated WhatsApp draft created for 24 bottles of Groundnut Oil 1L at wholesale rate ₹255.
                        </p>
                        <div className="pt-1 flex gap-2">
                          <div className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold text-[10px] border border-blue-700">
                            Auto-Draft Ready
                          </div>
                          <div className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 font-semibold text-[10px] border border-slate-300 dark:border-slate-600">
                            Credit Term: 15 Days
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t-2 border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex justify-between items-center">
                      <span>Threshold check: Active</span>
                      <span className="text-blue-600 dark:text-sky-400 font-bold">Zero Stockout Guarantee</span>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkspaceMode === 'finance' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative animate-in fade-in duration-200">
                  {/* Left: Margin & Sales Breakdown */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                            Real-Time Margin &amp; Profit Ledger
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-blue-600 dark:text-sky-400 font-bold">
                          27.8% Net Margin
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/80 shadow-2xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">Total Counter Sales</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">₹42,850.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/80 shadow-2xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">Goods Wholesale Cost (COGS)</span>
                          <span className="font-bold text-slate-600 dark:text-slate-400 tabular-nums">₹30,930.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-sky-50 dark:bg-blue-950/40 border-2 border-sky-300 dark:border-sky-800/60 shadow-2xs">
                          <span className="font-bold text-blue-800 dark:text-sky-300">Realized Store Profit Today</span>
                          <span className="font-extrabold text-blue-600 dark:text-sky-400 tabular-nums">₹11,920.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t-2 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Settlement Split:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">UPI: ₹28,250 (66%) · Cash: ₹14,600 (34%)</span>
                    </div>
                  </div>

                  {/* Right: GSTR-1 Automated Ledger */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                          <span>GSTR-1 Tax Engine</span>
                        </span>
                        <span className="text-[11px] font-mono text-blue-600 dark:text-sky-400 font-bold">100% Verified</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-2xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Taxable Value</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">₹40,810.00</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-2xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Central GST (CGST)</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">₹1,020.00</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700/80 flex justify-between items-center shadow-2xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">State GST (SGST)</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">₹1,020.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between items-center">
                      <span>Export: CA-Ready JSON &amp; Excel</span>
                      <span className="text-blue-600 dark:text-sky-400 font-semibold">1-Click Filing</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </motion.div>

      </div>

    </section>
  );
};

