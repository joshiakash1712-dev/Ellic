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

/**
 * Continuous 3-Tick Scroll-Driven Spiral Controller
 *
 * Calibrates mouse wheel and trackpad gestures so each stage transition takes ~3 scroll ticks:
 * - Tick 1 (+0.333): Incoming card peeks forward from behind along the rear orbital curve.
 * - Tick 2 (+0.667): Outgoing card sweeps up & around the stationary central laser; active state switches synchronously.
 * - Tick 3 (+1.000): New stage locks cleanly into center foreground focus.
 *
 * Guarantees:
 * - Zero premature auto-scrolling or section snapping before the user reaches the section.
 * - Exact reverse kinematics when scrolling upward.
 * - Clean boundary release at index 0 (up) and totalItems - 1 (down).
 * - Responsive without scroll-trapping on mobile/tablet (< 1024px).
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
  const lastDiscreteTickTimeRef = useRef<number>(0);
  const boundaryArrivalTimeRef = useRef<number>(0);
  const wasAtBoundaryRef = useRef<'start' | 'end' | null>(activeIndex === 0 ? 'start' : null);

  totalItemsRef.current = totalItems;
  onActiveChangeRef.current = onActiveChange;

  const getHeaderHeight = useCallback((): number => {
    if (typeof document === 'undefined') return 68;
    const headerEl = document.querySelector('header');
    return headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 68;
  }, []);

  // Animation loop interpolating progress -> targetProgress and keeping activeIndex synced
  const ensureAnimationLoop = useCallback(() => {
    if (rafRef.current) return;

    const step = () => {
      const target = clamp(targetProgressRef.current, 0, Math.max(0, totalItemsRef.current - 1));
      const current = progressRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.0018 || prefersReducedMotion) {
        progressRef.current = target;
        setProgress(target);
        const rounded = clamp(Math.round(target), 0, Math.max(0, totalItemsRef.current - 1));
        if (rounded !== activeIndexRef.current) {
          activeIndexRef.current = rounded;
          onActiveChangeRef.current(rounded);
        }
        rafRef.current = 0;
        return;
      }

      const next = current + diff * 0.22;
      progressRef.current = next;
      setProgress(next);

      const rounded = clamp(Math.round(next), 0, Math.max(0, totalItemsRef.current - 1));
      if (rounded !== activeIndexRef.current) {
        activeIndexRef.current = rounded;
        onActiveChangeRef.current(rounded);
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
  }, [prefersReducedMotion]);

  // Sync external activeIndex updates (e.g. button clicks, pills, direct stage click)
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    if (Math.round(targetProgressRef.current) !== activeIndex) {
      targetProgressRef.current = activeIndex;
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

  // Multi-section dominance check: section must naturally occupy top anchor zone
  const isDominantSection = useCallback((): boolean => {
    if (typeof window === 'undefined' || window.innerWidth < 1024) return false;
    const el = sectionRef.current;
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const headerHeight = getHeaderHeight();

    // Never hijack while the section is still approaching from below
    if (rect.top > headerHeight + 28) return false;
    // Release once mostly scrolled past top
    if (rect.bottom <= headerHeight + 220) return false;

    const allSections = Array.from(
      document.querySelectorAll<HTMLElement>('section[data-work-wheel="true"]')
    );
    if (allSections.length <= 1) return true;

    const myDistance = Math.abs(rect.top - headerHeight);
    for (const other of allSections) {
      if (other === el) continue;
      const otherRect = other.getBoundingClientRect();
      if (otherRect.top <= headerHeight + 28 && otherRect.bottom > headerHeight + 220) {
        if (Math.abs(otherRect.top - headerHeight) < myDistance) {
          return false;
        }
      }
    }

    return true;
  }, [getHeaderHeight]);

  const scheduleTrackpadSettle = useCallback(() => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      const currentTarget = targetProgressRef.current;
      const nearestInt = Math.round(currentTarget);
      // If close to an integer card center or idle in between, snap smoothly to nearest 1/3 or card lock
      const nextSnapped =
        Math.abs(currentTarget - nearestInt) < 0.24
          ? nearestInt
          : Math.round(currentTarget * 3) / 3;
      const clamped = clamp(nextSnapped, 0, Math.max(0, totalItemsRef.current - 1));
      if (Math.abs(clamped - targetProgressRef.current) > 0.002) {
        targetProgressRef.current = clamped;
        ensureAnimationLoop();
      }
    }, 240);
  }, [ensureAnimationLoop]);

  const handleWheelNative = useCallback(
    (e: WheelEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
      const dy = e.deltaY;
      if (Math.abs(dy) < 2.5) return;
      if (Math.abs(dy) < Math.abs(e.deltaX) * 0.8) return;

      if (!isDominantSection()) {
        setIsAnchored(false);
        return;
      }

      const maxIdx = Math.max(0, totalItemsRef.current - 1);
      const direction = dy > 0 ? 1 : -1;
      const currentTarget = targetProgressRef.current;
      const now = performance.now();

      // Boundary release: Down at last stage
      if (direction > 0 && currentTarget >= maxIdx - 0.004) {
        if (wasAtBoundaryRef.current !== 'end') {
          wasAtBoundaryRef.current = 'end';
          boundaryArrivalTimeRef.current = now;
        }
        if (now - boundaryArrivalTimeRef.current < 260) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        setIsAnchored(false);
        return;
      }

      // Boundary release: Up at first stage
      if (direction < 0 && currentTarget <= 0.004) {
        if (wasAtBoundaryRef.current !== 'start') {
          wasAtBoundaryRef.current = 'start';
          boundaryArrivalTimeRef.current = now;
        }
        if (now - boundaryArrivalTimeRef.current < 260) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        setIsAnchored(false);
        return;
      }

      // Within spiral stage progression -> capture scroll cleanly in-place
      e.preventDefault();
      e.stopPropagation();
      setIsAnchored(true);
      wasAtBoundaryRef.current = null;

      const isDiscreteTick = e.deltaMode !== 0 || Math.abs(dy) >= 38;

      if (isDiscreteTick) {
        // Cooldown prevents trackpad spike bursts from skipping >1 third per tick
        if (now - lastDiscreteTickTimeRef.current < 85) {
          return;
        }
        lastDiscreteTickTimeRef.current = now;

        // Quantize to 1/3 card increments so ~3 ticks = 1 complete card transition
        const nextTickQuantized =
          direction > 0
            ? Math.round((currentTarget + 1 / 3) * 3) / 3
            : Math.round((currentTarget - 1 / 3) * 3) / 3;

        const nextTarget = clamp(nextTickQuantized, 0, maxIdx);
        if (nextTarget >= maxIdx - 0.004) {
          wasAtBoundaryRef.current = 'end';
          boundaryArrivalTimeRef.current = now;
        } else if (nextTarget <= 0.004) {
          wasAtBoundaryRef.current = 'start';
          boundaryArrivalTimeRef.current = now;
        }

        targetProgressRef.current = nextTarget;
        ensureAnimationLoop();
      } else {
        // Smooth proportional trackpad progress (~135px travel per full card = 3 gentle micro-gestures)
        const nextTarget = clamp(currentTarget + dy / 135, 0, maxIdx);
        if (nextTarget >= maxIdx - 0.004 && currentTarget < maxIdx - 0.004) {
          wasAtBoundaryRef.current = 'end';
          boundaryArrivalTimeRef.current = now;
        } else if (nextTarget <= 0.004 && currentTarget > 0.004) {
          wasAtBoundaryRef.current = 'start';
          boundaryArrivalTimeRef.current = now;
        }
        targetProgressRef.current = nextTarget;
        ensureAnimationLoop();
        scheduleTrackpadSettle();
      }
    },
    [ensureAnimationLoop, isDominantSection, scheduleTrackpadSettle]
  );

  // Attach native non-passive wheel listener to section & window when dominant
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    const current = activeIndexRef.current;
    const total = totalItemsRef.current;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      if (current < total - 1) {
        e.preventDefault();
        onActiveChangeRef.current(current + 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (current > 0) {
        e.preventDefault();
        onActiveChangeRef.current(current - 1);
      }
    }
  }, []);

  // Derive 3-tick phase within the current active step transition (0, 1, 2, 3)
  const fractionalRemainder = progress - Math.floor(progress);
  const currentTickStep =
    progress >= totalItems - 1 - 0.01
      ? 3
      : Math.min(3, Math.round(fractionalRemainder * 3));

  return {
    sectionRef,
    cardRef,
    progress,
    currentTickStep,
    isAnchored,
    isLastItem: activeIndex === totalItems - 1,
    isFirstItem: activeIndex === 0,
    scrollToNextSection,
    scrollToPrevSection,
    scrollProps: {
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      'aria-label': `${sectionId || 'workflow-spiral'} stage, item ${activeIndex + 1} of ${totalItems}`,
    },
  };
}
