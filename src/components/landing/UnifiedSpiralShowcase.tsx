import React, { useEffect, useState } from 'react';
import { Disc } from 'lucide-react';
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
  hideBottomDock?: boolean;
  renderSimulator: (item: T, ctx: SpiralSimulatorRenderContext) => React.ReactNode;
}

export interface ThreeTickPose {
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

function sampleThreeTickKeyframes(
  t: number,
  frames: readonly [KeyframePose, KeyframePose, KeyframePose, KeyframePose]
): KeyframePose {
  const clampedT = clamp(t, 0, 1);
  const scaled = clampedT * 3;
  const idx = Math.min(2, Math.floor(scaled));
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
 * Computes continuous 3-tick helical spiral pose for a connected two-panel stage assembly:
 * - t = 0.00 (Settled): Active assembly locked solid dead-center (`tz > 0`); adjacent cards hidden behind.
 * - t = 0.33 (Tick 1):  Incoming assembly glides out along the rear orbital arc behind the pole (`tz < 0`),
 *                       while active eases smoothly to make room.
 * - t = 0.67 (Tick 2):  Active swings around receding rear wing (`tz < 0`); incoming rotates smoothly around
 *                       the opposite wing into foreground focus (`tz > 0`) with solid chassis backing.
 * - t = 1.00 (Tick 3):  Incoming locks dead-center solid (`tz > 0`, `opacity: 1`); outgoing tucks cleanly
 *                       behind (`opacity: 0`, hidden) with zero double text bleed or ghosting.
 */
export function computeThreeTickPose(
  idx: number,
  activeIndex: number,
  progress: number,
  horizontalSwing: number,
  prefersReducedMotion = false
): ThreeTickPose | null {
  const offset = clamp(progress - activeIndex, -1, 1);
  const absT = Math.abs(offset);
  const dir = offset === 0 ? 1 : Math.sign(offset);

  const isOutgoingCard = idx === activeIndex;
  const isIncomingCard = absT > 0.005 && idx === activeIndex + dir;

  if (!isOutgoingCard && !isIncomingCard) {
    return null;
  }

  if (prefersReducedMotion) {
    const showInCenter = (absT < 0.5 && isOutgoingCard) || (absT >= 0.5 && isIncomingCard);
    if (showInCenter) {
      return {
        tx: 0,
        ty: 0,
        tz: 0,
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
      tz: -176,
      rotY: 0,
      rotZ: 0,
      scale: 0.8,
      opacity: 0,
      zIndex: 10,
      hidden: true,
      isCenterFocus: false,
      inFrontOfPole: false,
    };
  }

  // Outgoing (`activeIndex`) helical orbit across [0, 1/3, 2/3, 1.0]
  // Settled active frame sits strictly at tz: 0 on the native 2D screen focal plane (zero 3D upscaling blur)
  const outgoingFrames: readonly [KeyframePose, KeyframePose, KeyframePose, KeyframePose] = [
    // 0.00: Settled dead center at native Z=0 screen plane (in front of zIndex-24 pole)
    { tx: 0, ty: 0, tz: 0, rotY: 0, rotZ: 0, scale: 1, opacity: 1 },
    // 0.33 (Tick 1): Yields gently along front-left/right arc while incoming previews behind pole
    { tx: -dir * horizontalSwing * 0.24, ty: -dir * 5, tz: 24, rotY: dir * 5, rotZ: -dir * 0.4, scale: 0.97, opacity: 1 },
    // 0.67 (Tick 2): Swings behind central pole wing cleanly out of incoming foreground path
    { tx: -dir * horizontalSwing * 1.22, ty: -dir * 16, tz: -78, rotY: dir * 23, rotZ: -dir * 1.9, scale: 0.84, opacity: 0.42 },
    // 1.00 (Tick 3): Completely tucked behind solid center chassis (zero ghosting)
    { tx: 0, ty: 0, tz: -176, rotY: 0, rotZ: 0, scale: 0.8, opacity: 0 },
  ];

  // Incoming (`activeIndex + dir`) helical orbit across [0, 1/3, 2/3, 1.0]
  const incomingFrames: readonly [KeyframePose, KeyframePose, KeyframePose, KeyframePose] = [
    // 0.00: Hidden behind pole
    { tx: 0, ty: 0, tz: -176, rotY: 0, rotZ: 0, scale: 0.8, opacity: 0 },
    // 0.33 (Tick 1): Enters visible rear orbital wing cleanly around pole
    { tx: dir * horizontalSwing * 1.18, ty: dir * 16, tz: -82, rotY: -dir * 21, rotZ: dir * 1.7, scale: 0.85, opacity: 0.72 },
    // 0.67 (Tick 2): Rotates forward in front of pole into foreground prominence
    { tx: dir * horizontalSwing * 0.26, ty: dir * 5, tz: 28, rotY: -dir * 6, rotZ: dir * 0.5, scale: 0.97, opacity: 1 },
    // 1.00 (Tick 3): Locks dead-center 100% solid at native Z=0 screen plane (zero perspective blur)
    { tx: 0, ty: 0, tz: 0, rotY: 0, rotZ: 0, scale: 1, opacity: 1 },
  ];

  const targetFrames = isOutgoingCard ? outgoingFrames : incomingFrames;
  const pose = sampleThreeTickKeyframes(absT, targetFrames);
  const inFrontOfPole = pose.tz >= 0;
  const hidden = pose.opacity < 0.02;

  const isCenterFocus =
    (isOutgoingCard && absT < 0.38) ||
    (isIncomingCard && absT >= 0.58);

  const zIndex = isCenterFocus
    ? 50
    : inFrontOfPole
    ? 42
    : 16;

  return {
    ...pose,
    zIndex,
    hidden,
    isCenterFocus,
    inFrontOfPole,
  };
}

/**
 * Full-Width Synchronized 3-Tick 3D Spiral Showcase Architecture
 *
 * Unifies the Left Circular Workflow Dial, central Helical Coupler Rail, and Right Live Simulator
 * inside one connected assembly that revolves together around a stationary central cylindrical pole
 * backed by ThreeUI Gallery + subdued LaserCollection within `#070B14`.
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
  prevLabel: _prevLabel = 'Prev',
  nextLabel: _nextLabel = 'Next',
  hideBottomDock: _hideBottomDock = false,
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
  const horizontalSwing = viewportWidth >= 1280 ? 112 : viewportWidth >= 1040 ? 84 : 60;

  const {
    sectionRef,
    cardRef,
    progress,
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
        {/* Stationary Section Heading & Brief Subtitle (outside the orbiting 3D stage) */}
        <div className="max-w-3xl mx-auto text-center mb-4 sm:mb-6">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#38BDF8]/30 bg-[#0E1726] text-[#7DD3FC] text-[11px] font-mono font-bold uppercase tracking-widest mb-2.5">
              <span className="w-3 h-[1.5px] bg-[#38BDF8]" />
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

        {/* Full Interactive 3-Tick 3D Helical Showcase Body */}
        <div
          ref={cardRef}
          {...scrollProps}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-3xl"
        >
          {/* DESKTOP & WIDE TABLET (>= 900px, covers 80%-150% zoom): Unified Two-Panel Synchronized 3-Tick Helix */}
          {isWideViewport ? (
            <div
              className="relative w-full h-[465px] xl:h-[490px] flex items-center justify-center"
              style={{
                perspective: isSettled || prefersReducedMotion ? 'none' : '1850px',
                transformStyle: isSettled || prefersReducedMotion ? 'flat' : 'preserve-3d',
              }}
            >
              {/* Stationary Central Architectural Cylindrical Pole (fixed behind zIndex-50 active assembly) */}
              <SpiralCentralPole progress={progress} />

              {/* Synchronized Paired Two-Panel Assemblies Revolving Around Central Pole */}
              {items.map((item, idx) => {
                const pose = computeThreeTickPose(
                  idx,
                  activeIndex,
                  progress,
                  horizontalSwing,
                  Boolean(prefersReducedMotion)
                );

                if (!pose) return null;

                const isInteractive = pose.isCenterFocus && !pose.hidden;
                const isSettledActive =
                  isSettled &&
                  idx === activeIndex &&
                  pose.isCenterFocus &&
                  !pose.hidden &&
                  Math.abs(pose.tx) < 0.5 &&
                  Math.abs(pose.ty) < 0.5 &&
                  Math.abs(pose.rotY) < 0.1;

                const outgoingRecedingBlur =
                  !prefersReducedMotion &&
                  !pose.isCenterFocus &&
                  idx === activeIndex &&
                  pose.tz < -20 &&
                  !pose.hidden
                    ? `blur(${Math.min(2.2, Math.abs(pose.tz + 20) * 0.025).toFixed(2)}px)`
                    : 'none';

                return (
                  <div
                    key={item.id}
                    data-spiral-assembly={idx}
                    data-in-front={pose.inFrontOfPole ? 'true' : 'false'}
                    data-active={idx === activeIndex ? 'true' : 'false'}
                    data-settled={isSettledActive ? 'true' : 'false'}
                    data-hidden={pose.hidden ? 'true' : 'false'}
                    onClick={() => {
                      if (!pose.isCenterFocus && !pose.hidden) {
                        goToStage(idx);
                      }
                    }}
                    style={
                      isSettledActive
                        ? {
                            position: 'absolute',
                            width: 'min(96%, 1060px)',
                            transform: 'none',
                            opacity: 1,
                            visibility: 'visible',
                            zIndex: pose.zIndex,
                            transformStyle: 'flat',
                            filter: 'none',
                            willChange: 'auto',
                            pointerEvents: 'auto',
                          }
                        : {
                            position: 'absolute',
                            width: 'min(96%, 1060px)',
                            transform: `translate3d(${pose.tx.toFixed(1)}px, ${pose.ty.toFixed(1)}px, ${pose.tz.toFixed(1)}px) rotateY(${pose.rotY.toFixed(2)}deg) rotateZ(${pose.rotZ.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`,
                            opacity: Number(pose.opacity.toFixed(3)),
                            visibility: pose.hidden ? 'hidden' : 'visible',
                            zIndex: pose.zIndex,
                            transformStyle: 'flat',
                            backfaceVisibility: 'hidden',
                            filter: outgoingRecedingBlur,
                            willChange: 'transform, opacity',
                            pointerEvents: pose.hidden ? 'none' : 'auto',
                          }
                    }
                    className={`h-[435px] xl:h-[455px] grid grid-cols-12 items-stretch gap-2.5 lg:gap-3.5 rounded-2xl antialiased ${
                      !pose.isCenterFocus && !pose.hidden ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Solid Opaque Backing Chassis when dominant in foreground so rear wings never bleed text */}
                    {pose.opacity > 0.92 && (
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

                    {/* CENTRAL HELICAL COUPLER BRIDGE connecting Dial & Simulator around Z=0 Pole */}
                    <div
                      aria-hidden="true"
                      className="relative z-10 col-span-1 flex flex-col items-center justify-center pointer-events-none"
                    >
                      <div
                        className="w-full h-[14px] relative rounded-full flex items-center justify-center border"
                        style={{
                          background: pose.isCenterFocus
                            ? 'linear-gradient(90deg, #0E1726 0%, #1D4ED8 50%, #0E1726 100%)'
                            : 'linear-gradient(90deg, #09111E 0%, #1E293B 50%, #09111E 100%)',
                          borderColor: pose.isCenterFocus
                            ? 'rgba(56, 189, 248, 0.55)'
                            : 'rgba(148, 163, 184, 0.25)',
                          boxShadow: pose.isCenterFocus ? '0 0 18px rgba(37, 99, 235, 0.4)' : 'none',
                        }}
                      >
                        <div
                          className="w-full h-[2px] mx-1 rounded-full"
                          style={{
                            background: pose.isCenterFocus
                              ? 'linear-gradient(90deg, #2563EB, #7DD3FC, #2563EB)'
                              : 'rgba(148, 163, 184, 0.3)',
                          }}
                        />
                        <span
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-extrabold"
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

                    {/* RIGHT WING: Live Workflow Simulator Panel (revolves synchronously with Left Dial) */}
                    <div
                      className={`relative z-10 col-span-6 h-full ${
                        !isInteractive ? 'pointer-events-none' : ''
                      }`}
                    >
                      {renderSimulator(item, {
                        index: idx,
                        total,
                        isActive: idx === activeIndex || pose.isCenterFocus,
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
                style={{
                  perspective: isSettled || prefersReducedMotion ? 'none' : '1200px',
                  transformStyle: isSettled || prefersReducedMotion ? 'flat' : 'preserve-3d',
                }}
              >
                <SpiralCentralPole progress={progress} compact />

                <div
                  className="relative z-30 w-full space-y-3 antialiased"
                  style={
                    isSettled || prefersReducedMotion
                      ? {
                          transform: 'none',
                          willChange: 'auto',
                          filter: 'none',
                        }
                      : {
                          transform: `rotateY(${((activeIndex - progress) * -10).toFixed(2)}deg)`,
                          willChange: 'transform',
                        }
                  }
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
                          className="w-7 h-7 rounded-lg font-mono text-[10px] font-bold cursor-pointer transition-colors"
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
        </div>
      </div>

      {/* Full-Section Deep-Navy Atmospheric Backdrop (ThreeUI Gallery + subdued LaserCollection) */}
      <aside aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <SpiralAtmosphereBackdrop liteMode={!isWideViewport} />
      </aside>
    </section>
  );
}
