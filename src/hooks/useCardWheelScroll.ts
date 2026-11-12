import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface UseCardWheelScrollOptions {
  totalItems: number;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  wheelThreshold?: number;
  debounceMs?: number;
  sectionId?: string;
  enableAnchor?: boolean;
}

/**
 * High-Precision Viewport-Aware Scroll-Card Hook for Ellic Work Wheel Demonstrations
 * 
 * Capabilities:
 * - Natural Entry: Preceding content scrolls normally. Never forces an auto-scroll jump toward approaching sections.
 * - Intentional Anchoring: Activates pinned card navigation ONLY when the section naturally aligns under the sticky header.
 * - Scroll-Driven Progression: Natural wheel or trackpad gestures advance stages in-place with debounced momentum.
 * - Synchronous Multi-Panel Updates: Both circular Work Wheel dial and right monitor update simultaneously.
 * - Natural Release: Releases cleanly on the last card when scrolling down, and on the first card when scrolling up.
 * - Responsive: Smooth natural scrolling on mobile/tablet (< 1024px) without wheel trapping.
 */
export function useCardWheelScroll({
  totalItems,
  activeIndex,
  onActiveChange,
  wheelThreshold = 46,
  debounceMs = 280,
  sectionId,
  enableAnchor = true,
}: UseCardWheelScrollOptions) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnchored, setIsAnchored] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const isLastItem = activeIndex === totalItems - 1;
  const isFirstItem = activeIndex === 0;

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const totalItemsRef = useRef(totalItems);
  totalItemsRef.current = totalItems;

  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const wheelAccumulatorRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);

  // Helper to measure sticky header height dynamically
  const getHeaderHeight = useCallback((): number => {
    if (typeof document === 'undefined') return 68;
    const headerEl = document.querySelector('header');
    return headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 68;
  }, []);

  // Determine if this section has naturally reached its reading anchor under the sticky header
  const isDominantSection = useCallback((): boolean => {
    if (typeof window === 'undefined' || window.innerWidth < 1024) return false;
    const el = sectionRef.current;
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const headerHeight = getHeaderHeight();

    // Section must have naturally arrived at or slightly above the header anchor point.
    // If rect.top > headerHeight + 18, it is still approaching from below -> DO NOT hijack!
    if (rect.top > headerHeight + 18) {
      return false;
    }

    // Section must still have substantial content in the visible viewport.
    // If rect.bottom <= headerHeight + 120, it has scrolled past the top -> DO NOT hijack!
    if (rect.bottom <= headerHeight + 120) {
      return false;
    }

    // Multi-section arbitration: the section whose top is closest to headerHeight wins
    const allWorkSections = Array.from(document.querySelectorAll<HTMLElement>('section[data-work-wheel="true"]'));
    if (allWorkSections.length <= 1) return true;

    const myDistance = Math.abs(rect.top - headerHeight);
    for (const other of allWorkSections) {
      if (other === el) continue;
      const otherRect = other.getBoundingClientRect();
      if (otherRect.top <= headerHeight + 18 && otherRect.bottom > headerHeight + 120) {
        const otherDistance = Math.abs(otherRect.top - headerHeight);
        if (otherDistance < myDistance) {
          return false;
        }
      }
    }

    return true;
  }, [getHeaderHeight]);

  // Step active card by delta (-1 or +1) while keeping viewport stationary
  const stepBy = useCallback(
    (delta: number): boolean => {
      const now = performance.now();
      if (now - lastStepTimeRef.current < debounceMs) {
        return false;
      }

      const current = activeIndexRef.current;
      const total = totalItemsRef.current;
      const next = Math.max(0, Math.min(total - 1, current + delta));

      if (next !== current) {
        lastStepTimeRef.current = now;
        wheelAccumulatorRef.current = 0;
        onActiveChangeRef.current(next);
        return true;
      }
      return false;
    },
    [debounceMs]
  );

  // Programmatically scroll down to the next section (only triggered by explicit button click)
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

  // Programmatically scroll up to previous section (only triggered by explicit button click)
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

  // Main native wheel event handler
  const handleWheelNative = useCallback(
    (e: WheelEvent) => {
      // Allow natural fluid scroll on mobile/tablet viewports (< 1024px)
      if (typeof window !== 'undefined' && window.innerWidth < 1024) return;

      const dy = e.deltaY;
      if (Math.abs(dy) < 3) return;

      // Ignore pure horizontal gestures
      if (Math.abs(dy) < Math.abs(e.deltaX) * 0.75) return;

      const el = sectionRef.current;
      if (!el) return;

      // Only handle if this section has naturally reached its reading anchor
      if (!isDominantSection()) {
        setIsAnchored(false);
        return;
      }

      const direction = dy > 0 ? 1 : -1;
      const current = activeIndexRef.current;
      const total = totalItemsRef.current;
      const now = performance.now();

      // BOUNDARY 1: Scrolling DOWN and on the LAST card -> Release lock and let website scroll down!
      if (direction > 0 && current >= total - 1) {
        // If we just stepped to the last card, absorb lingering momentum so the user can see the final card
        if (now - lastStepTimeRef.current < debounceMs) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        setIsAnchored(false);
        wheelAccumulatorRef.current = 0;
        return;
      }

      // BOUNDARY 2: Scrolling UP and on the FIRST card -> Release lock and let website scroll up!
      if (direction < 0 && current <= 0) {
        // If we just stepped to the first card, absorb lingering momentum so the user can see the first card
        if (now - lastStepTimeRef.current < debounceMs) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        setIsAnchored(false);
        wheelAccumulatorRef.current = 0;
        return;
      }

      // WITHIN DEMONSTRATION RANGE:
      // Prevent browser vertical document scroll while intermediate cards step in-place
      e.preventDefault();
      e.stopPropagation();
      setIsAnchored(true);

      // Respect debounce timer to avoid multi-stage skipping
      if (now - lastStepTimeRef.current < debounceMs) {
        return;
      }

      const isDiscreteTick = e.deltaMode !== 0 || Math.abs(dy) >= 42;

      if (isDiscreteTick) {
        stepBy(direction);
      } else {
        // Continuous trackpad gesture accumulation
        wheelAccumulatorRef.current += dy;
        if (Math.abs(wheelAccumulatorRef.current) >= wheelThreshold) {
          const step = Math.sign(wheelAccumulatorRef.current);
          const stepped = stepBy(step);
          if (stepped) {
            wheelAccumulatorRef.current = 0;
          }
        }
      }
    },
    [isDominantSection, stepBy, debounceMs, wheelThreshold]
  );

  // Touch swipe support for touchscreens on desktop preview (>= 1024px)
  const handleTouchStartNative = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMoveNative = useCallback(
    (e: TouchEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) return;
      if (e.touches.length === 0) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = touchStartYRef.current - currentY; // positive = swipe up (scroll down)
      const deltaX = currentX - touchStartXRef.current;

      if (Math.abs(deltaY) < 30) return;
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) return;

      if (!isDominantSection()) return;

      const direction = deltaY > 0 ? 1 : -1;
      const current = activeIndexRef.current;
      const total = totalItemsRef.current;

      if (direction > 0 && current >= total - 1) return;
      if (direction < 0 && current <= 0) return;

      if (e.cancelable) {
        e.preventDefault();
      }

      const stepped = stepBy(direction);
      if (stepped) {
        touchStartYRef.current = currentY;
      }
    },
    [isDominantSection, stepBy]
  );

  // Attach non-passive wheel event listeners to both the section and window
  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const onWheel = (e: WheelEvent) => handleWheelNative(e);

    sectionEl.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('wheel', onWheel, { passive: false });
    sectionEl.addEventListener('touchstart', handleTouchStartNative, { passive: true });
    sectionEl.addEventListener('touchmove', handleTouchMoveNative, { passive: false });

    return () => {
      sectionEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('wheel', onWheel);
      sectionEl.removeEventListener('touchstart', handleTouchStartNative);
      sectionEl.removeEventListener('touchmove', handleTouchMoveNative);
    };
  }, [handleWheelNative, handleTouchStartNative, handleTouchMoveNative]);

  // Keyboard navigation when focused
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
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
    },
    []
  );

  return {
    sectionRef,
    cardRef,
    isAnchored,
    isLastItem,
    isFirstItem,
    scrollToNextSection,
    scrollToPrevSection,
    scrollProps: {
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      'aria-label': `${sectionId || 'work-wheel'} card, item ${activeIndex + 1} of ${totalItems}`,
    },
  };
}
