import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface FinalCTAProps {
  onOpenGetStarted?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenGetStarted }) => {
  return (
    <section id="pricing" className="py-12 sm:py-20 md:py-32 bg-white dark:bg-slate-950 transition-colors duration-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Container with High-Contrast Slate Canvas */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-slate-950 text-white p-6 sm:p-12 lg:p-16 overflow-hidden shadow-2xl border border-slate-900 dark:border-slate-800">
          
          {/* Subtle Background Structural Grid & Ambient Sapphire Glow */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
          <div className="hero-ambient-orb absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            
            {/* Tagline Kicker */}
            <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold tracking-widest text-sky-400 uppercase select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)] animate-pulse" />
              <span>Ellic Platform</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-semibold normal-case tracking-normal">Cloud &amp; Offline Ready</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              A simpler way to run your business.
            </h2>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
              Join progressive store owners, supermarkets, and wholesalers who have retired complicated legacy systems for a calm, connected business platform.
            </p>

            {/* Primary CTA Button with Magnetic Desktop Interaction */}
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="btn-final-cta-getstarted"
                type="button"
                data-cursor="hover"
                data-magnetic="true"
                onClick={onOpenGetStarted}
                className="website-btn-glow w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm sm:text-base font-bold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span data-magnetic-inner className="flex items-center gap-2">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-150" />
                </span>
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-2.5 text-[11px] sm:text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" /> Free 14-day full trial
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" /> Complete data privacy & backup
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
