import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Disc } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useSpiralScroll } from '../../hooks/useSpiralScroll';
import { SpiralAtmosphereBackdrop } from './SpiralAtmosphereBackdrop';
import { SpiralCentralPole } from './SpiralCentralPole';
import { SpiralDialPanel, SpiralDialItemDef } from './SpiralDialPanel';

export interface SpiralSimulatorRenderContext {
  index: number;
  total: number;
  isActive: boolean;
  isInteractive: boolean;
  onPrev: () => void;
  onNext: () => void;
  onJumpToNextSection: () => void;
}

export interface UnifiedSpiralShowcaseProps<T extends SpiralDialItemDef> {
  sectionId: string;
  anchorAliasId?: string;
  eyebrow?: string;
  heading: string;
  description?: string;
  items: T[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  dialLabel: string;
  dialSublabel: string;
  prevLabel?: string;
  nextLabel?: string;
  renderSimulator: (item: T, ctx: SpiralSimulatorRenderContext) => React.ReactNode;
}

export interface FiveTickPose {
  tx: number;
  ty: number;
  tz: number;
  rotY: number;
  rotZ: number;
  scale: number;
  opacity: number;
  zIndex: number;
  hidden: boolean;
  isCenterFocus: boolean;
  inFrontOfPole: boolean;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothLerp(a: number, b: number, t: number): number {
  const s = t * t * (3 - 2 * t);
  return a + (b - a) * s;
}

interface KeyframePose {
  tx: number;
  ty: number;
  tz: number;
  rotY: number;
  rotZ: number;
  scale: number;
  opacity: number;
}

function sampleKeyframes(t: number, frames: readonly [KeyframePose, KeyframePose, KeyframePose, KeyframePose, KeyframePose, KeyframePose]): KeyframePose {
  const clampedT = clamp(t, 0, 1);
  const scaled = clampedT * 5;
  const idx = Math.min(4, Math.floor(scaled));
  const localT = scaled - idx;
  const from = frames[idx];
  const to = frames[idx + 1];

  return {
    tx: smoothLerp(from.tx, to.tx, localT),
    ty: smoothLerp(from.ty, to.ty, localT),
    tz: smoothLerp(from.tz, to.tz, localT),
    rotY: smoothLerp(from.rotY, to.rotY, localT),
    rotZ: smoothLerp(from.rotZ, to.rotZ, localT),
    scale: smoothLerp(from.scale, to.scale, localT),
    opacity: smoothLerp(from.opacity, to.opacity, localT),
  };
}

/**
 * Computes exact 5-tick spiral pose for a unified two-panel stage assembly:
 * - t = 0.0 (Idle): Active assembly settled dead-center, zero rear clutter.
 * - t = 0.2 (Tick 1): Incoming neighbor objects peek in around the front card edge.
 * - t = 0.4 (Tick 2): Incoming neighbor rotates out prominently & displays clearly.
 * - t = 0.6 (Tick 3): Active card locks completely center-front, 100% opaque (no transparency);
 *                     ALL rear assemblies collapse strictly behind (tx=0, opacity=0) and hide.
 * - t = 0.8 (Tick 4): Rear/incoming assemblies re-emerge visibly behind the front card.
 * - t = 1.0 (Tick 5): Incoming card sweeps cleanly into center foreground and takes active focus.
 */
export function computeFiveTickPose(
  idx: number,
  activeIndex: number,
  progress: number,
  horizontalSwing: number,
  prefersReducedMotion = false
): FiveTickPose | null {
  const offset = clamp(progress - activeIndex, -1, 1);
  const absT = Math.abs(offset);
  const dir = offset === 0 ? 1 : Math.sign(offset);

  const isFrontCard = idx === activeIndex;
  const isIncomingCard = absT > 0.005 && idx === activeIndex + dir;

  if (!isFrontCard && !isIncomingCard) {
    return null;
  }

  if (prefersReducedMotion) {
    if (isFrontCard) {
      return {
        tx: 0,
        ty: 0,
        tz: 56,
        rotY: 0,
        rotZ: 0,
        scale: 1,
        opacity: 1,
        zIndex: 50,
        hidden: false,
        isCenterFocus: true,
        inFrontOfPole: true,
      };
    }
    return {
      tx: 0,
      ty: 0,
      tz: -160,
      rotY: 0,
      rotZ: 0,
      scale: 0.84,
      opacity: 0,
      zIndex: 10,
      hidden: true,
      isCenterFocus: false,
      inFrontOfPole: false,
    };
  }

  // Front active assembly keyframes across ticks [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  const frontFrames: readonly [KeyframePose, KeyframePose, KeyframePose, KeyframePose, KeyframePose, KeyframePose] = [
    // 0.0: Settled solid center
    { tx: 0, ty: 0, tz: 56, rotY: 0, rotZ: 0, scale: 1, opacity: 1 },
    // 0.2 (Tick 1): Eases slightly aside so next objects peek in
    { tx: -dir * 26, ty: -4, tz: 48, rotY: dir * 4.5, rotZ: -dir * 0.4, scale: 0.98, opacity: 1 },
    // 0.4 (Tick 2): Swings out along helical wing while incoming displays clearly
    { tx: -dir * horizontalSwing * 0.9, ty: -dir * 16, tz: 12, rotY: dir * 16, rotZ: -dir * 1.4, scale: 0.91, opacity: 0.96 },
    // 0.6 (Tick 3): Completely front & centered, 100% solid opaque (zero transparency)
    { tx: 0, ty: 0, tz: 62, rotY: 0, rotZ: 0, scale: 1, opacity: 1 },
    // 0.8 (Tick 4): Angles gently forward while rear things emerge visibly behind it
    { tx: -dir * 28, ty: -dir * 8, tz: 46, rotY: dir * 8, rotZ: -dir * 0.7, scale: 0.96, opacity: 1 },
    // 1.0 (Tick 5): Tucks cleanly behind as incoming card changes to active focus
    { tx: 0, ty: 0, tz: -168, rotY: 0, rotZ: 0, scale: 0.82, opacity: 0 },
  ];

  // Incoming neighbor assembly keyframes across ticks [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  const incomingFrames: readonly [KeyframePose, KeyframePose, KeyframePose, KeyframePose, KeyframePose, KeyframePose] = [
    // 0.0: Hidden cleanly behind settled card
    { tx: 0, ty: 0, tz: -168, rotY: 0, rotZ: 0, scale: 0.82, opacity: 0 },
    // 0.2 (Tick 1): Peeks in out behind the right/left edge around central pole
    { tx: dir * horizontalSwing * 1.12, ty: dir * 14, tz: -74, rotY: -dir * 18, rotZ: dir * 1.6, scale: 0.88, opacity: 0.84 },
    // 0.4 (Tick 2): Sweeps out & displays clearly beside/in front of pole
    { tx: dir * horizontalSwing * 0.94, ty: dir * 12, tz: 22, rotY: -dir * 13, rotZ: dir * 1.1, scale: 0.94, opacity: 0.98 },
    // 0.6 (Tick 3): Completely hidden strictly behind focused card (zero peek, zero leak)
    { tx: 0, ty: 0, tz: -180, rotY: 0, rotZ: 0, scale: 0.80, opacity: 0 },
    // 0.8 (Tick 4): Re-emerges behind focused card along rear spiral lane
    { tx: dir * horizontalSwing * 1.06, ty: dir * 16, tz: -66, rotY: -dir * 18, rotZ: dir * 1.5, scale: 0.89, opacity: 0.88 },
    // 1.0 (Tick 5): Completes revolution into dead-center foreground focus
    { tx: 0, ty: 0, tz: 56, rotY: 0, rotZ: 0, scale: 1, opacity: 1 },
  ];

  const pose = sampleKeyframes(absT, isFrontCard ? frontFrames : incomingFrames);
  const inFrontOfPole = pose.tz >= 0;
  const hidden = pose.opacity < 0.02;

  const isCenterFocus =
    (isFrontCard && absT < 0.9 && !(absT > 0.3 && absT < 0.5)) ||
    (isIncomingCard && absT >= 0.9);

  const zIndex = isFrontCard
    ? inFrontOfPole
      ? 50
      : 14
    : inFrontOfPole
    ? 44
    : 16;

  return {
    ...pose,
    zIndex,
    hidden,
    isCenterFocus,
    inFrontOfPole,
  };
}

const TICK_PHASE_LABELS: Record<number, string> = {
  1: 'TICK 1/5 · PEEK IN',
  2: 'TICK 2/5 · DISPLAY',
  3: 'TICK 3/5 · SOLO FOCUS',
  4: 'TICK 4/5 · BEHIND VIEW',
  5: 'TICK 5/5 · CHANGE',
};

/**
 * Full-Width Synchronized 5-Tick 3D Spiral Showcase Architecture
 *
 * Unifies the Left Circular Workflow Dial and Right Live Workflow Simulator inside a
 * single connected two-panel helical assembly that revolves together around a stationary
 * central vertical cylindrical pole inside a continuous deep-navy `#070B14` theater.
 */
export function UnifiedSpiralShowcase<T extends SpiralDialItemDef>({
  sectionId,
  anchorAliasId,
  eyebrow,
  heading,
  description,
  items,
  activeIndex,
  onActiveChange,
  dialLabel,
  dialSublabel,
  prevLabel = 'Prev',
  nextLabel = 'Next',
  renderSimulator,
}: UnifiedSpiralShowcaseProps<T>) {
  const prefersReducedMotion = useReducedMotion();
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener('resize', updateWidth, { passive: true });
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const isWideViewport = viewportWidth >= 900;
  const horizontalSwing = viewportWidth >= 1280 ? 114 : viewportWidth >= 1040 ? 86 : 62;

  const {
    sectionRef,
    cardRef,
    progress,
    currentTickStep,
    isSettled,
    goToStage,
    scrollToNextSection,
    scrollProps,
  } = useSpiralScroll({
    totalItems: items.length,
    activeIndex,
    onActiveChange,
    sectionId,
  });

  const activeItem = items[activeIndex] || items[0];
  const total = items.length;

  const handlePrev = () => {
    if (activeIndex > 0) {
      goToStage(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < total - 1) {
      goToStage(activeIndex + 1);
    } else {
      scrollToNextSection();
    }
  };

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      data-work-wheel="true"
      className="ellic-spiral-section relative py-8 sm:py-10 lg:py-12 scroll-mt-20 border-b border-slate-800/80 overflow-x-clip select-none"
      style={{ backgroundColor: '#070B14', color: '#F8FAFC' }}
    >
      {/* Optional alias scroll anchor (non-div element so GSAP :scope > div targets main wrapper) */}
      {anchorAliasId && (
        <span
          id={anchorAliasId}
          aria-hidden="true"
          className="absolute top-0 left-0 -mt-20 pointer-events-none"
        />
      )}

      {/* Primary Content Wrapper — first direct div for GSAP reveal choreography */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stationary Section Heading & Brief Subtitle (never orbits in 3D) */}
        <div className="max-w-3xl mx-auto text-center mb-5 sm:mb-7">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#38BDF8]/30 bg-[#0E1726] text-[#7DD3FC] text-[11px] font-mono font-bold uppercase tracking-widest mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              <span>{eyebrow}</span>
            </div>
          )}
          <h2
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight break-words"
            style={{ textWrap: 'balance' }}
          >
            {heading}
          </h2>
          {description && (
            <p className="mt-2 text-xs sm:text-sm text-[#CBD5E1] max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Full Interactive 5-Tick 3D Helical Showcase Body */}
        <div
          ref={cardRef}
          {...scrollProps}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-3xl"
        >
          {/* DESKTOP & WIDE TABLET (>= 900px, covers 80%-150% zoom): Unified Two-Panel Synchronized 5-Tick Helix */}
          {isWideViewport ? (
            <div
              className="relative w-full h-[465px] xl:h-[490px] flex items-center justify-center"
              style={{
                perspective: '1850px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Stationary Central Architectural Cylindrical Pole (sits at Z = 0px) */}
              <SpiralCentralPole progress={progress} />

              {/* Synchronized Paired Two-Panel Assemblies Revolving in 5 Ticks */}
              {items.map((item, idx) => {
                const pose = computeFiveTickPose(
                  idx,
                  activeIndex,
                  progress,
                  horizontalSwing,
                  Boolean(prefersReducedMotion)
                );

                if (!pose) return null;

                const isInteractive = pose.isCenterFocus && !pose.hidden;

                return (
                  <div
                    key={item.id}
                    data-spiral-assembly={idx}
                    data-in-front={pose.inFrontOfPole ? 'true' : 'false'}
                    data-active={idx === activeIndex ? 'true' : 'false'}
                    data-hidden={pose.hidden ? 'true' : 'false'}
                    onClick={() => {
                      if (!pose.isCenterFocus && !pose.hidden) {
                        goToStage(idx);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      width: 'min(96%, 1060px)',
                      transform: `translate3d(${pose.tx.toFixed(1)}px, ${pose.ty.toFixed(1)}px, ${pose.tz.toFixed(1)}px) rotateY(${pose.rotY.toFixed(2)}deg) rotateZ(${pose.rotZ.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`,
                      opacity: Number(pose.opacity.toFixed(3)),
                      visibility: pose.hidden ? 'hidden' : 'visible',
                      zIndex: pose.zIndex,
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                      willChange: 'transform, opacity',
                      pointerEvents: pose.hidden ? 'none' : 'auto',
                    }}
                    className={`h-[435px] xl:h-[455px] grid grid-cols-12 items-stretch gap-3 lg:gap-4 rounded-2xl ${
                      !pose.isCenterFocus && !pose.hidden ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Solid Non-Transparent Backing Chassis behind bridge gaps on Tick 3 / Solo Focus */}
                    {pose.opacity > 0.99 && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          backgroundColor: '#070B14',
                          zIndex: 0,
                        }}
                      />
                    )}

                    {/* LEFT WING: Circular Workflow Dial Panel */}
                    <div
                      className={`relative z-10 col-span-5 h-full ${
                        !isInteractive ? 'pointer-events-none' : ''
                      }`}
                    >
                      <SpiralDialPanel
                        items={items}
                        stageIndex={idx}
                        activeIndex={activeIndex}
                        onSelectStage={goToStage}
                        label={dialLabel}
                        sublabel={dialSublabel}
                        isInteractive={isInteractive}
                      />
                    </div>

                    {/* CENTRAL HELICAL COUPLER BRIDGE (solid opaque chassis connecting both panels across Z=0 pole) */}
                    <div
                      aria-hidden="true"
                      className="relative z-10 col-span-1 flex flex-col items-center justify-center pointer-events-none"
                    >
                      <div
                        className="w-full h-[3px] relative rounded-full"
                        style={{
                          background: pose.isCenterFocus
                            ? 'linear-gradient(90deg, #2563EB, #7DD3FC, #2563EB)'
                            : 'linear-gradient(90deg, #1E3A8A, #38BDF8, #1E3A8A)',
                          boxShadow: pose.isCenterFocus ? '0 0 14px rgba(56, 189, 248, 0.55)' : 'none',
                        }}
                      >
                        <span
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[9px] font-extrabold"
                          style={{
                            backgroundColor: '#070B14',
                            color: pose.isCenterFocus ? '#7DD3FC' : '#94A3B8',
                            border: `1.5px solid ${
                              pose.isCenterFocus ? '#38BDF8' : '#475569'
                            }`,
                            boxShadow: pose.isCenterFocus ? '0 0 14px rgba(56, 189, 248, 0.45)' : 'none',
                          }}
                        >
                          {item.number}
                        </span>
                      </div>
                    </div>

                    {/* RIGHT WING: Live Workflow Simulator Panel (moves synchronously with Left Dial) */}
                    <div
                      className={`relative z-10 col-span-6 h-full ${
                        !isInteractive ? 'pointer-events-none' : ''
                      }`}
                    >
                      {renderSimulator(item, {
                        index: idx,
                        total,
                        isActive: idx === activeIndex,
                        isInteractive,
                        onPrev: handlePrev,
                        onNext: handleNext,
                        onJumpToNextSection: scrollToNextSection,
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MOBILE & PORTRAIT TABLET (< 900px): Single-Column Unified Spatial Assembly Around Central Pole */
            <div className="space-y-4">
              {/* Scrollable Quick Stage Pills */}
              <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
                {items.map((item, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goToStage(idx)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border"
                      style={
                        isCurrent
                          ? {
                              backgroundColor: '#2563EB',
                              borderColor: '#38BDF8',
                              color: '#FFFFFF',
                              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                            }
                          : {
                              backgroundColor: '#0E1726',
                              borderColor: 'rgba(148, 163, 184, 0.28)',
                              color: '#CBD5E1',
                            }
                      }
                    >
                      <span className="font-mono text-[10px] opacity-80">{item.number}</span>
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Compact Spatial Helix Container around Stationary Central Pole */}
              <div
                className="relative py-2 flex items-center justify-center"
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
              >
                <SpiralCentralPole progress={progress} compact />

                <div
                  className="relative z-30 w-full space-y-3 transition-transform duration-300 ease-out"
                  style={{
                    transform: prefersReducedMotion
                      ? 'none'
                      : `translate3d(0, 0, 20px) rotateY(${((activeIndex - progress) * -10).toFixed(2)}deg)`,
                  }}
                >
                  {/* Compact Synchronized Dial Strip */}
                  <div
                    className="rounded-2xl border p-3 flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: '#0E1726',
                      borderColor: 'rgba(56, 189, 248, 0.32)',
                      boxShadow: '0 14px 32px -10px rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
                          borderColor: 'rgba(186, 230, 253, 0.6)',
                          color: '#FFFFFF',
                        }}
                      >
                        {React.createElement(activeItem?.icon || Disc, { className: 'w-5 h-5' })}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#38BDF8]">
                          STAGE {activeItem?.number} · {dialLabel}
                        </div>
                        <div className="text-sm font-extrabold text-white truncate">
                          {activeItem?.title}
                        </div>
                      </div>
                    </div>

                    <span className="sm:hidden font-mono text-[11px] font-bold text-[#7DD3FC] px-2 py-1 rounded-lg border border-[#38BDF8]/30 bg-[#070B14] shrink-0">
                      {activeIndex + 1}/{total}
                    </span>

                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      {items.map((it, idx) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => goToStage(idx)}
                          aria-label={`Select stage ${it.number}: ${it.title}`}
                          className="w-6 h-6 rounded-lg font-mono text-[10px] font-bold cursor-pointer transition-colors"
                          style={
                            idx === activeIndex
                              ? {
                                  backgroundColor: '#2563EB',
                                  color: '#FFFFFF',
                                  border: '1px solid #38BDF8',
                                }
                              : {
                                  backgroundColor: '#070B14',
                                  color: '#94A3B8',
                                  border: '1px solid rgba(148, 163, 184, 0.25)',
                                }
                          }
                        >
                          {it.number}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paired Full-Width Interactive Simulator */}
                  {activeItem &&
                    renderSimulator(activeItem, {
                      index: activeIndex,
                      total,
                      isActive: true,
                      isInteractive: true,
                      onPrev: handlePrev,
                      onNext: handleNext,
                      onJumpToNextSection: scrollToNextSection,
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Stationary Unified Bottom Navigation & 5-Tick Telemetry Dock */}
          <div
            className="mt-5 sm:mt-6 px-3.5 sm:px-5 py-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
            style={{
              backgroundColor: '#0E1726',
              borderColor: 'rgba(56, 189, 248, 0.28)',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Left: Prev Stage Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              aria-label={prevLabel}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: '#09111E',
                borderColor: 'rgba(148, 163, 184, 0.3)',
                color: '#E2E8F0',
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{prevLabel}</span>
            </button>

            {/* Center: Direct Stage Pills + 5-Tick Orbit Meter */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 min-w-0 flex-1 justify-center">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 scrollbar-none">
                {items.map((it, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => goToStage(idx)}
                      aria-label={`Jump to stage ${it.number}: ${it.title}`}
                      aria-pressed={isCurrent}
                      className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                      style={
                        isCurrent
                          ? {
                              background: 'linear-gradient(90deg, #2563EB, #0EA5E9)',
                              color: '#FFFFFF',
                              boxShadow: '0 0 14px rgba(56, 189, 248, 0.42)',
                            }
                          : idx < activeIndex
                          ? {
                              backgroundColor: '#13274A',
                              color: '#7DD3FC',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                            }
                          : {
                              backgroundColor: '#070B14',
                              color: '#94A3B8',
                              border: '1px solid rgba(148, 163, 184, 0.22)',
                            }
                      }
                      title={`${it.number}. ${it.title}`}
                    >
                      <span>{it.number}</span>
                      {isCurrent && (
                        <span className="hidden lg:inline font-sans font-semibold truncate max-w-[140px]">
                          · {it.title}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 5-Tick Scroll Phase Readout (Desktop) */}
              {isWideViewport && (
                <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-[#94A3B8] shrink-0">
                  <span className="text-[#7DD3FC] font-bold">
                    {isSettled ? 'LOCKED · 5/5' : TICK_PHASE_LABELS[currentTickStep] || `TICK ${currentTickStep}/5`}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((t) => {
                      const activeTick = isSettled ? true : currentTickStep >= t;
                      return (
                        <span
                          key={t}
                          className="w-2 h-1.5 rounded-full transition-colors"
                          style={{
                            backgroundColor: activeTick ? '#38BDF8' : '#1E293B',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Next Stage / Next Section Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label={activeIndex === total - 1 ? 'Next Section' : nextLabel}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border"
              style={{
                backgroundColor: '#2563EB',
                borderColor: 'rgba(56, 189, 248, 0.55)',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              <span>{activeIndex === total - 1 ? 'Next Section' : nextLabel}</span>
              {activeIndex === total - 1 ? (
                <ArrowRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full-Section Deep-Navy Atmospheric Backdrop (ThreeUI Gallery + subdued LaserCollection) */}
      <aside aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <SpiralAtmosphereBackdrop liteMode={!isWideViewport} />
      </aside>
    </section>
  );
}
