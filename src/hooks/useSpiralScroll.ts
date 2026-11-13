import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface UseSpiralScrollOptions {
  totalItems: number;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  sectionId?: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

const DESKTOP_SPIRAL_MIN_WIDTH = 900;
const TICKS_PER_STAGE = 5;
const TICK_STEP = 1 / TICKS_PER_STAGE; // 0.2 per scroll tick
const TICK_DELTA_THRESHOLD = 34;
const TICK_COOLDOWN_MS = 115;
const STAGE_DETENT_MS = 220;
const BOUNDARY_HOLD_MS = 260;

/**
 * Synchronized 5-Tick Scroll-Driven Spiral Controller
 *
 * Calibrates mouse wheel and trackpad gestures so each stage transition
 * progresses through 5 deliberate ticks (1/5 = 0.20 increments):
 * - Tick 1 (0.2): Objects behind peek in along the spiral edge.
 * - Tick 2 (0.4): Peeking assembly rotates forward and displays clearly.
 * - Tick 3 (0.6): Focused assembly locks 100% solid (zero transparency); all
 *                 rear assemblies hide strictly behind it with zero bleed.
 * - Tick 4 (0.8): Rear/upcoming assemblies emerge cleanly behind the front card.
 * - Tick 5 (1.0): Active card changes (`activeIndex` switches cleanly) and settles.
 *
 * Supports symmetric forward & reverse 5-tick choreography and clean boundary release.
 */
export function useSpiralScroll({
  totalItems,
  activeIndex,
  onActiveChange,
  sectionId,
}: UseSpiralScrollOptions) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<number>(activeIndex);
  const [isAnchored, setIsAnchored] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const progressRef = useRef<number>(activeIndex);
  const targetProgressRef = useRef<number>(activeIndex);
  const activeIndexRef = useRef<number>(activeIndex);
  const totalItemsRef = useRef<number>(totalItems);
  const onActiveChangeRef = useRef(onActiveChange);

  const rafRef = useRef<number>(0);
  const settleTimerRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(0);
  const lastWheelEventTimeRef = useRef<number>(0);
  const wheelAccumRef = useRef<number>(0);
  const stageDetentUntilRef = useRef<number>(0);
  const boundaryArrivalTimeRef = useRef<number>(0);
  const wasAtBoundaryRef = useRef<'start' | 'end' | null>(activeIndex === 0 ? 'start' : null);

  totalItemsRef.current = totalItems;
  onActiveChangeRef.current = onActiveChange;

  const getHeaderHeight = useCallback((): number => {
    if (typeof document === 'undefined') return 68;
    const headerEl = document.querySelector('header');
    return headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 68;
  }, []);

  const syncActiveIndexAtTick5 = useCallback((val: number) => {
    const maxIdx = Math.max(0, totalItemsRef.current - 1);
    const currentActive = activeIndexRef.current;

    // Only switch active card once progress completes Tick 5 (>= 0.96 away from current active)
    if (Math.abs(val - currentActive) >= 0.96) {
      const nextActive = clamp(Math.round(val), 0, maxIdx);
      if (nextActive !== currentActive) {
        activeIndexRef.current = nextActive;
        onActiveChangeRef.current(nextActive);
      }
    }
  }, []);

  const ensureAnimationLoop = useCallback(() => {
    if (rafRef.current) return;

    const step = () => {
      const maxIdx = Math.max(0, totalItemsRef.current - 1);
      const target = clamp(targetProgressRef.current, 0, maxIdx);
      const current = progressRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.0018 || prefersReducedMotion) {
        progressRef.current = target;
        setProgress(target);
        syncActiveIndexAtTick5(target);
        rafRef.current = 0;
        return;
      }

      const next = current + diff * 0.25;
      progressRef.current = next;
      setProgress(next);
      syncActiveIndexAtTick5(next);

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
  }, [prefersReducedMotion, syncActiveIndexAtTick5]);

  const goToStage = useCallback(
    (index: number) => {
      const maxIdx = Math.max(0, totalItemsRef.current - 1);
      const clamped = clamp(index, 0, maxIdx);
      wheelAccumRef.current = 0;
      targetProgressRef.current = clamped;

      if (clamped === 0) {
        wasAtBoundaryRef.current = 'start';
      } else if (clamped === maxIdx) {
        wasAtBoundaryRef.current = 'end';
      } else {
        wasAtBoundaryRef.current = null;
      }

      if (clamped !== activeIndexRef.current) {
        activeIndexRef.current = clamped;
        onActiveChangeRef.current(clamped);
      }

      if (prefersReducedMotion) {
        progressRef.current = clamped;
        setProgress(clamped);
      } else {
        ensureAnimationLoop();
      }
    },
    [ensureAnimationLoop, prefersReducedMotion]
  );

  // Sync external activeIndex overrides cleanly without disturbing in-flight 5-tick glides
  useEffect(() => {
    const prev = activeIndexRef.current;
    activeIndexRef.current = activeIndex;
    if (prev !== activeIndex && Math.abs(targetProgressRef.current - activeIndex) > 0.12) {
      targetProgressRef.current = activeIndex;
      wheelAccumRef.current = 0;
      if (prefersReducedMotion) {
        progressRef.current = activeIndex;
        setProgress(activeIndex);
      } else {
        ensureAnimationLoop();
      }
    }
  }, [activeIndex, ensureAnimationLoop, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  const isDominantSection = useCallback(
    (direction: 1 | -1): boolean => {
      if (typeof window === 'undefined' || window.innerWidth < DESKTOP_SPIRAL_MIN_WIDTH) {
        return false;
      }
      const el = sectionRef.current;
      if (!el) return false;

      const headerHeight = getHeaderHeight();
      const vh = window.innerHeight || 800;
      const anchorBandTop = headerHeight + 8;
      const anchorBandBottom = vh - 60;

      const scoreSection = (sec: HTMLElement): number => {
        const rect = sec.getBoundingClientRect();
        if (rect.top > Math.min(vh * 0.42, headerHeight + 240)) return -1;
        if (rect.bottom < headerHeight + 200) return -1;

        const visibleTop = Math.max(rect.top, anchorBandTop);
        const visibleBottom = Math.min(rect.bottom, anchorBandBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const minRequired = Math.min(260, vh * 0.34);
        if (visibleHeight < minRequired) return -1;

        const secCenter = rect.top + rect.height * 0.5;
        const viewCenter = headerHeight + (vh - headerHeight) * 0.5;
        const centerDist = Math.abs(secCenter - viewCenter);
        return visibleHeight - centerDist * 0.45 + (direction > 0 && rect.top <= headerHeight + 90 ? 40 : 0);
      };

      const myScore = scoreSection(el);
      if (myScore < 0) return false;

      const allSections = Array.from(
        document.querySelectorAll<HTMLElement>('section[data-work-wheel="true"]')
      );
      for (const other of allSections) {
        if (other === el) continue;
        const otherScore = scoreSection(other);
        if (otherScore > myScore) {
          return false;
        }
      }

      return true;
    },
    [getHeaderHeight]
  );

  const scheduleGentleSettle = useCallback(() => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      const currentTarget = targetProgressRef.current;
      const maxIdx = Math.max(0, totalItemsRef.current - 1);
      const snappedTick = Math.round(currentTarget * TICKS_PER_STAGE) / TICKS_PER_STAGE;
      const clamped = clamp(snappedTick, 0, maxIdx);
      if (Math.abs(clamped - targetProgressRef.current) > 0.002) {
        targetProgressRef.current = clamped;
        ensureAnimationLoop();
      }
    }, 240);
  }, [ensureAnimationLoop]);

  const handleWheelNative = useCallback(
    (e: WheelEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth < DESKTOP_SPIRAL_MIN_WIDTH) return;
      const dy = e.deltaY;
      if (Math.abs(dy) < 2) return;
      if (Math.abs(dy) < Math.abs(e.deltaX) * 0.85) return;

      const direction: 1 | -1 = dy > 0 ? 1 : -1;
      if (!isDominantSection(direction)) {
        setIsAnchored(false);
        return;
      }

      const maxIdx = Math.max(0, totalItemsRef.current - 1);
      const currentTarget = targetProgressRef.current;
      const now = performance.now();

      // Clean boundary release: scrolling down past final stage
      if (direction > 0 && currentTarget >= maxIdx - 0.004) {
        if (wasAtBoundaryRef.current !== 'end') {
          wasAtBoundaryRef.current = 'end';
          boundaryArrivalTimeRef.current = now;
        }
        if (now - boundaryArrivalTimeRef.current < BOUNDARY_HOLD_MS) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        setIsAnchored(false);
        wheelAccumRef.current = 0;
        return;
      }

      // Clean boundary release: scrolling up past first stage
      if (direction < 0 && currentTarget <= 0.004) {
        if (wasAtBoundaryRef.current !== 'start') {
          wasAtBoundaryRef.current = 'start';
          boundaryArrivalTimeRef.current = now;
        }
        if (now - boundaryArrivalTimeRef.current < BOUNDARY_HOLD_MS) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        setIsAnchored(false);
        wheelAccumRef.current = 0;
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setIsAnchored(true);
      wasAtBoundaryRef.current = null;

      if (now < stageDetentUntilRef.current) {
        wheelAccumRef.current = 0;
        return;
      }

      if (now - lastTickTimeRef.current < TICK_COOLDOWN_MS) {
        return;
      }

      const isDiscreteWheel = e.deltaMode !== 0 || Math.abs(dy) >= 44;

      if (isDiscreteWheel) {
        wheelAccumRef.current = 0;
      } else {
        if (
          now - lastWheelEventTimeRef.current > 160 ||
          (wheelAccumRef.current !== 0 && Math.sign(wheelAccumRef.current) !== direction)
        ) {
          wheelAccumRef.current = 0;
        }
        lastWheelEventTimeRef.current = now;
        wheelAccumRef.current += dy;

        if (Math.abs(wheelAccumRef.current) < TICK_DELTA_THRESHOLD) {
          scheduleGentleSettle();
          return;
        }
        wheelAccumRef.current = 0;
      }

      lastTickTimeRef.current = now;

      // Advance strictly by 1 calibrated tick (1/5 = 0.20) so 5 ticks = 1 complete stage change
      const quantizedNext =
        Math.round((currentTarget + direction * TICK_STEP) * TICKS_PER_STAGE) / TICKS_PER_STAGE;
      const nextTarget = clamp(quantizedNext, 0, maxIdx);

      // Engage magnetic stage detent right on Tick 5 card settlement
      if (Math.abs(nextTarget - Math.round(nextTarget)) < 0.015) {
        stageDetentUntilRef.current = now + STAGE_DETENT_MS;
      }

      if (nextTarget >= maxIdx - 0.004) {
        wasAtBoundaryRef.current = 'end';
        boundaryArrivalTimeRef.current = now;
      } else if (nextTarget <= 0.004) {
        wasAtBoundaryRef.current = 'start';
        boundaryArrivalTimeRef.current = now;
      }

      targetProgressRef.current = nextTarget;
      ensureAnimationLoop();
      scheduleGentleSettle();
    },
    [ensureAnimationLoop, isDominantSection, scheduleGentleSettle]
  );

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const onWheel = (e: WheelEvent) => handleWheelNative(e);
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, [handleWheelNative]);

  const scrollToNextSection = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const nextEl = el.nextElementSibling as HTMLElement | null;
    const headerHeight = getHeaderHeight();
    if (nextEl) {
      const targetY = Math.round(nextEl.getBoundingClientRect().top + window.scrollY - headerHeight - 4);
      window.scrollTo({
        top: targetY,
        behavior: prefersReducedMotion ? 'instant' : 'smooth',
      });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  }, [getHeaderHeight, prefersReducedMotion]);

  const scrollToPrevSection = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const prevEl = el.previousElementSibling as HTMLElement | null;
    const headerHeight = getHeaderHeight();
    if (prevEl) {
      const targetY = Math.round(prevEl.getBoundingClientRect().top + window.scrollY - headerHeight - 4);
      window.scrollTo({
        top: targetY,
        behavior: prefersReducedMotion ? 'instant' : 'smooth',
      });
    } else {
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
    }
  }, [getHeaderHeight, prefersReducedMotion]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const current = activeIndexRef.current;
      const total = totalItemsRef.current;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (current < total - 1) {
          e.preventDefault();
          goToStage(current + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (current > 0) {
          e.preventDefault();
          goToStage(current - 1);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToStage(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToStage(total - 1);
      }
    },
    [goToStage]
  );

  // Derive visible 5-tick step phase relative to activeIndex (0 = settled/locked, 1..5 = orbit ticks)
  const deltaFromActive = Math.abs(progress - activeIndex);
  const isSettled = deltaFromActive < 0.03;
  const currentTickStep = isSettled
    ? TICKS_PER_STAGE
    : Math.max(1, Math.min(TICKS_PER_STAGE, Math.round(deltaFromActive * TICKS_PER_STAGE)));

  return {
    sectionRef,
    cardRef,
    progress,
    currentTickStep,
    isSettled,
    isAnchored,
    isLastItem: activeIndex === totalItems - 1,
    isFirstItem: activeIndex === 0,
    goToStage,
    scrollToNextSection,
    scrollToPrevSection,
    scrollProps: {
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      'aria-label': `${sectionId || 'workflow-spiral'} stage, item ${activeIndex + 1} of ${totalItems}`,
    },
  };
}
