import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { RotateCw, ChevronLeft, ChevronRight, Compass, Sparkles, Disc } from 'lucide-react';

export interface WorkWheelItemDef {
  id: string;
  number: string;
  title: string;
  tagline?: string;
  icon: React.ElementType;
}

export interface WorkWheelStageProps {
  items: WorkWheelItemDef[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  label?: string;
  sublabel?: string;
  className?: string;
}

/**
 * High-Precision Interactive Work Wheel Rotary Dial
 * Completely self-contained, 100% vector SVG & CSS graphics.
 * Features:
 * - Precision chronograph tick marks & dynamic laser beam pointer
 * - Dual-layer orbital rotation with smooth spring physics
 * - Touch & pointer drag-to-spin gesture recognition
 * - Wheel scrolling with debounced momentum
 * - Center holographic hub with active stage icon & telemetry
 * - Floating node tooltips & hover indicators
 */
export const WorkWheelStage: React.FC<WorkWheelStageProps> = ({
  items,
  activeIndex,
  onActiveChange,
  label = 'Workflow',
  sublabel = 'Continuous Cycle',
  className = '',
}) => {
  const count = items.length;
  const prefersReducedMotion = useReducedMotion();
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredNodeIdx, setHoveredNodeIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag interaction tracking
  const dragStartYRef = useRef(0);
  const dragStartIdxRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const wheelAccumulatorRef = useRef(0);

  // Target angle: aligns active item at 12 o'clock (-90 deg offset)
  const anglePerItem = count > 0 ? 360 / count : 60;
  const targetRotation = -(activeIndex * anglePerItem);

  const activeItem = items[activeIndex] || items[0];
  const ActiveIcon = activeItem?.icon || Disc;

  const handleNext = useCallback(() => {
    onActiveChange((activeIndex + 1) % count);
  }, [activeIndex, count, onActiveChange]);

  const handlePrev = useCallback(() => {
    onActiveChange((activeIndex - 1 + count) % count);
  }, [activeIndex, count, onActiveChange]);

  // Handle wheel scrolling over the rotary dial
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (Math.abs(e.deltaY) < 4) return;
      const now = performance.now();
      if (now - lastWheelTimeRef.current < 70) return;

      wheelAccumulatorRef.current += e.deltaY;
      const threshold = 28;

      if (Math.abs(wheelAccumulatorRef.current) >= threshold) {
        lastWheelTimeRef.current = now;
        if (wheelAccumulatorRef.current > 0) {
          if (activeIndex < count - 1) {
            onActiveChange(activeIndex + 1);
          }
        } else {
          if (activeIndex > 0) {
            onActiveChange(activeIndex - 1);
          }
        }
        wheelAccumulatorRef.current = 0;
      }
    },
    [activeIndex, count, onActiveChange]
  );

  // Pointer drag to spin gesture
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only capture if clicking the wheel stage background, not direct node buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartIdxRef.current = activeIndex;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = dragStartYRef.current - e.clientY;
    const dragThreshold = 36;
    const stepDelta = Math.round(deltaY / dragThreshold);

    if (stepDelta !== 0) {
      let nextIdx = dragStartIdxRef.current + stepDelta;
      // Clamp or wrap
      nextIdx = Math.max(0, Math.min(count - 1, nextIdx));
      if (nextIdx !== activeIndex) {
        onActiveChange(nextIdx);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Pre-generate 36 precision tick marks (every 10 degrees)
  const dialTicks = useMemo(() => {
    const ticks = [];
    const totalTicks = 36;
    for (let i = 0; i < totalTicks; i++) {
      const angle = (i * (360 / totalTicks) * Math.PI) / 180;
      const isCardinal = i % 9 === 0; // 0, 90, 180, 270 deg
      const isMajor = i % 3 === 0;
      const rInner = isCardinal ? 136 : isMajor ? 140 : 143;
      const rOuter = 149;

      const x1 = 170 + rInner * Math.cos(angle);
      const y1 = 170 + rInner * Math.sin(angle);
      const x2 = 170 + rOuter * Math.cos(angle);
      const y2 = 170 + rOuter * Math.sin(angle);

      ticks.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        isCardinal,
        isMajor,
      });
    }
    return ticks;
  }, []);

  // Compute laser pointer line coordinates for active node
  const activeNodePos = useMemo(() => {
    const activeNodeAngle = activeIndex * anglePerItem - 90;
    const rad = (activeNodeAngle * Math.PI) / 180;
    const radius = 126;
    const cx = 170 + radius * Math.cos(rad);
    const cy = 170 + radius * Math.sin(rad);

    // Inner point near hub perimeter
    const hubRadius = 56;
    const hx = 170 + hubRadius * Math.cos(rad);
    const hy = 170 + hubRadius * Math.sin(rad);

    return { cx, cy, hx, hy };
  }, [activeIndex, anglePerItem]);

  return (
    <div
      ref={wheelContainerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredNodeIdx(null);
      }}
      className={`relative flex flex-col justify-between rounded-3xl border-2 border-slate-300 dark:border-slate-800 bg-gradient-to-b from-white/95 via-slate-50/80 to-slate-100/90 dark:from-[#0B132B]/90 dark:via-[#070B14]/95 dark:to-[#0B132B]/85 shadow-lg dark:shadow-2xl shadow-blue-500/5 dark:shadow-black/40 overflow-hidden select-none transition-all duration-300 ${
        isDragging ? 'cursor-grabbing' : 'cursor-default'
      } ${className}`}
    >
      {/* Background ambient lighting & micro-grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12)_0%,rgba(37,99,235,0.04)_50%,transparent_75%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] opacity-15 dark:opacity-20 pointer-events-none" />

      {/* Center 2D Rotary Dial Assembly */}
      <div className="relative flex-1 min-h-[260px] sm:min-h-[290px] xl:min-h-[310px] flex items-center justify-center p-2 sm:p-3 xl:p-4 overflow-hidden">
        
        {/* Subtle Static Concentric Background Guides */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] sm:w-[330px] sm:h-[330px] rounded-full border border-dashed border-slate-200 dark:border-slate-800/80 opacity-60" />
          <div className="w-[230px] h-[230px] sm:w-[260px] sm:h-[260px] rounded-full border border-slate-200/70 dark:border-slate-800/50 opacity-50" />
          <div className="w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full border border-sky-500/20 dark:border-sky-400/20 shadow-[0_0_20px_rgba(56,189,248,0.08)]" />
        </div>

        {/* The Rotary Assembly Box */}
        <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] xl:w-[340px] xl:h-[340px] max-w-full aspect-square flex items-center justify-center">
          
          {/* Animated Rotating Assembly: Nodes and Tracks */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: targetRotation }}
            transition={
              prefersReducedMotion
                ? { duration: 0.1 }
                : { type: 'spring', stiffness: 220, damping: 26, mass: 0.7 }
            }
          >
            {/* SVG Track with precision ticks, laser guide, and active glowing arc */}
            <svg
              className="w-full h-full pointer-events-none overflow-visible"
              viewBox="0 0 340 340"
            >
              <defs>
                <linearGradient id="activeArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>

                <linearGradient id="laserBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
                  <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
                </linearGradient>

                <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* Precision Perimeter Ticks */}
              <g className="text-slate-300 dark:text-slate-800">
                {dialTicks.map((tick) => (
                  <line
                    key={tick.id}
                    x1={tick.x1}
                    y1={tick.y1}
                    x2={tick.x2}
                    y2={tick.y2}
                    stroke="currentColor"
                    strokeWidth={tick.isCardinal ? 2 : tick.isMajor ? 1.5 : 1}
                    strokeOpacity={tick.isCardinal ? 0.9 : tick.isMajor ? 0.6 : 0.3}
                  />
                ))}
              </g>

              {/* Main Circular Guide Orbit */}
              <circle
                cx="170"
                cy="170"
                r="126"
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="2"
                strokeDasharray="4 6"
              />

              {/* Glowing Active Arc following current active position */}
              <circle
                cx="170"
                cy="170"
                r="126"
                fill="none"
                stroke="url(#activeArcGrad)"
                strokeWidth="3.5"
                strokeDasharray="70 280"
                strokeDashoffset={-activeIndex * (791 / count)}
                className="transition-all duration-500 ease-out"
                filter="url(#laserGlow)"
              />

              {/* Laser Pointer Guide Beam from center hub to active node */}
              <line
                x1={activeNodePos.hx}
                y1={activeNodePos.hy}
                x2={activeNodePos.cx}
                y2={activeNodePos.cy}
                stroke="url(#laserBeamGrad)"
                strokeWidth="2"
                strokeDasharray="2 3"
                filter="url(#laserGlow)"
                className="transition-all duration-300"
              />
            </svg>

            {/* Positioned Node Buttons along circular perimeter */}
            {items.map((item, idx) => {
              const nodeAngle = idx * anglePerItem - 90;
              const rad = (nodeAngle * Math.PI) / 180;
              const radius = 126;
              const cx = 170 + radius * Math.cos(rad);
              const cy = 170 + radius * Math.sin(rad);
              const isActive = idx === activeIndex;
              const isNodeHovered = hoveredNodeIdx === idx;
              const NodeIcon = item.icon;

              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: `${(cx / 340) * 100}%`,
                    top: `${(cy / 340) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="z-20"
                >
                  {/* Keep node icon upright by counter-rotating against assembly */}
                  <motion.div
                    animate={{ rotate: -targetRotation }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.1 }
                        : { type: 'spring', stiffness: 220, damping: 26, mass: 0.7 }
                    }
                    className="relative flex items-center justify-center"
                  >
                    {/* Active Ambient Halo Glow */}
                    {isActive && (
                      <span className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-blue-500/40 via-sky-400/50 to-cyan-400/40 blur-md pointer-events-none animate-pulse" />
                    )}

                    <button
                      type="button"
                      onClick={() => onActiveChange(idx)}
                      onMouseEnter={() => setHoveredNodeIdx(idx)}
                      onMouseLeave={() => setHoveredNodeIdx(null)}
                      aria-label={`Select stage ${item.number}: ${item.title}`}
                      className={`relative flex items-center justify-center rounded-2xl transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                        isActive
                          ? 'w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-xl shadow-blue-500/40 ring-4 ring-sky-400/30 scale-110 z-10'
                          : 'w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-[#0c1324]/95 backdrop-blur-md border-2 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/20 hover:scale-110 active:scale-95 shadow-2xs'
                      }`}
                    >
                      <NodeIcon
                        className={`transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'w-6 h-6' : 'w-4 h-4 sm:w-4.5 sm:h-4.5'
                        }`}
                      />

                      {/* Number Tag Pill */}
                      <span
                        className={`absolute -bottom-1 -right-1 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none shadow-sm ${
                          isActive
                            ? 'bg-slate-950 text-sky-300 border border-sky-400/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {item.number}
                      </span>
                    </button>

                    {/* Node Hover Tooltip */}
                    <AnimatePresence>
                      {isNodeHovered && !isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full mb-2 px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[11px] font-semibold whitespace-nowrap shadow-xl border border-slate-800 pointer-events-none z-30"
                        >
                          <span>{item.title}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>

          {/* Central Holographic Hub Core */}
          <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white dark:bg-[#070B14]/95 backdrop-blur-2xl border-2 border-slate-300 dark:border-sky-500/40 shadow-xl shadow-blue-500/10 dark:shadow-[0_0_35px_rgba(56,189,248,0.2)] flex flex-col items-center justify-center p-2.5 text-center pointer-events-none">
            {/* Ambient Inner Halo */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-blue-500/10 via-sky-500/5 to-cyan-500/10 pointer-events-none" />

            {/* Hub Floating Icon & Step Badge */}
            <div className="relative flex items-center justify-center gap-1 mb-0.5">
              <ActiveIcon className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                STAGE {activeItem?.number || '01'}
              </span>
            </div>

            {/* Active Stage Title */}
            <div className="relative text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white truncate max-w-[92px] sm:max-w-[105px] leading-tight tracking-tight">
              {activeItem?.title}
            </div>

            {/* Active Stage Sublabel / Tagline */}
            <div className="relative text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[85px] sm:max-w-[95px]">
              {activeItem?.tagline || sublabel}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Segmented Step Stepper & Quick Nav */}
      <div className="px-4 sm:px-5 py-3 border-t-2 border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#070B14]/70 backdrop-blur-md z-10 flex items-center justify-between gap-2">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous stage"
          className="p-2 rounded-xl border-2 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white cursor-pointer flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Center Segmented Step Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[200px] sm:max-w-none scrollbar-none">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onActiveChange(idx)}
                aria-label={`Jump to stage ${item.number}: ${item.title}`}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-8 bg-gradient-to-r from-blue-600 to-sky-500 shadow-sm shadow-sky-500/40'
                    : idx < activeIndex
                    ? 'w-3 bg-blue-300/80 dark:bg-blue-800/80 hover:bg-blue-400'
                    : 'w-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
                title={`${item.number}. ${item.title}`}
              />
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next stage"
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white cursor-pointer flex items-center justify-center shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
