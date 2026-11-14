import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowRight, BookOpen, X } from 'lucide-react';
import {
  loadGuideProgress,
  markGuideDismissed,
} from './guideData';
import { getSavedCookiePreferences } from '../../../config/legal.config';

export interface FirstTimeGuideBannerProps {
  isGuideOpen?: boolean;
  onStartGuide: (step?: number) => void;
  guideProgressStep?: number;
  guideCompleted?: boolean;
}

export const FirstTimeGuideBanner: React.FC<FirstTimeGuideBannerProps> = ({
  isGuideOpen = false,
  onStartGuide,
  guideProgressStep = 0,
  guideCompleted = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [hasCookieBanner, setHasCookieBanner] = useState<boolean>(() => !getSavedCookiePreferences());

  useEffect(() => {
    const syncCookieState = () => {
      setHasCookieBanner(!getSavedCookiePreferences());
    };
    window.addEventListener('ellix-cookie-updated', syncCookieState);
    return () => window.removeEventListener('ellix-cookie-updated', syncCookieState);
  }, []);

  useEffect(() => {
    const progress = loadGuideProgress();
    if (progress.completed || progress.dismissed || guideCompleted) {
      setIsVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const latest = loadGuideProgress();
      if (!latest.completed && !latest.dismissed) {
        setIsVisible(true);
      }
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [guideCompleted]);

  const handleDismiss = () => {
    markGuideDismissed();
    setIsVisible(false);
  };

  const handleStartOrResume = () => {
    setIsVisible(false);
    const resumeStep =
      guideProgressStep >= 1 && guideProgressStep <= 12 ? guideProgressStep : 0;
    onStartGuide(resumeStep);
  };

  const isResuming = guideProgressStep >= 1 && guideProgressStep <= 12 && !guideCompleted;
  const shouldRender = isVisible && !isGuideOpen && !hasCookieBanner;

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.aside
          aria-label="First-time visitor guided tour prompt"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-3 right-16 sm:bottom-5 sm:left-6 sm:right-auto z-40 sm:w-96 rounded-2xl bg-[#121826]/95 backdrop-blur-xl border border-sky-500/35 shadow-[0_18px_42px_rgba(0,0,0,0.5),0_0_24px_rgba(56,189,248,0.14)] p-3 sm:p-4 text-white"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              <BookOpen className="w-3 h-3 text-sky-400" />
              <span>{isResuming ? 'CONTINUE YOUR GUIDE' : 'NEW TO ELLIC?'}</span>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss guided tour prompt"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {isResuming ? (
            <div className="space-y-1 mb-2.5 sm:mb-3">
              <div className="text-sm font-bold text-white">
                You&apos;re on Step {guideProgressStep} of 12.
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pick up right where you left off in the interactive Ellic platform walkthrough.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-200 leading-relaxed mb-2.5 sm:mb-3">
              See how the entire platform connects your everyday business operations.
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartOrResume}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isResuming ? 'Continue Guide →' : 'Start Guided Tour'}</span>
              {!isResuming && <ArrowRight className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-[#161D2C] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Explore Alone
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
