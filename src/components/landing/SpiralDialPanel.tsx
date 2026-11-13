import React, { useId, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Disc } from 'lucide-react';

export interface SpiralDialItemDef {
  id: string;
  number: string;
  title: string;
  tagline?: string;
  description?: string;
  icon: React.ElementType;
}

export interface SpiralDialPanelProps {
  items: SpiralDialItemDef[];
  /** Stage index represented by THIS assembly panel in the 3D spiral */
  stageIndex: number;
  /** Currently focused active index in the section */
  activeIndex: number;
  onSelectStage: (index: number) => void;
  label?: string;
  sublabel?: string;
  /** Only front-focused stage gets keyboard tab stops */
  isInteractive?: boolean;
  /** Compact mode for < 900px responsive composition */
  compact?: boolean;
}

/**
 * Circular Workflow Dial Visualization Panel (Left Wing of Helical Assembly)
 *
 * Restores and preserves every interactive feature from WorkWheelStage inside a
 * crisp `#0E1726` deep-navy architectural dial housing with unique `useId()` SVG
 * definitions so multiple helical stages across 5 sections never collide.
 */
export const SpiralDialPanel: React.FC<SpiralDialPanelProps> = ({
  items,
  stageIndex,
  activeIndex,
  onSelectStage,
  label = 'Workflow Dial',
  sublabel = 'Synchronized Cycle',
  isInteractive = true,
  compact = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const arcGradId = `arcGrad-${uid}`;
  const laserGradId = `laserGrad-${uid}`;
  const glowFilterId = `dialGlow-${uid}`;

  const prefersReducedMotion = useReducedMotion();
  const [hoveredNodeIdx, setHoveredNodeIdx] = useState<number | null>(null);

  const count = Math.max(1, items.length);
  const anglePerItem = 360 / count;
  const displayedIndex = stageIndex;
  const targetRotation = -(displayedIndex * anglePerItem);
  const currentItem = items[displayedIndex] || items[0];
  const HubIcon = currentItem?.icon || Disc;
  const isCurrentActive = displayedIndex === activeIndex;

  // 36 precision chronograph tick marks
  const dialTicks = useMemo(() => {
    const ticks = [];
    const totalTicks = 36;
    for (let i = 0; i < totalTicks; i++) {
      const angle = (i * (360 / totalTicks) * Math.PI) / 180;
      const isCardinal = i % 9 === 0;
      const isMajor = i % 3 === 0;
      const rInner = isCardinal ? 136 : isMajor ? 140 : 143;
      const rOuter = 149;
      ticks.push({
        id: i,
        x1: 170 + rInner * Math.cos(angle),
        y1: 170 + rInner * Math.sin(angle),
        x2: 170 + rOuter * Math.cos(angle),
        y2: 170 + rOuter * Math.sin(angle),
        isCardinal,
        isMajor,
      });
    }
    return ticks;
  }, []);

  // Laser beam coordinates connecting center holographic hub to this stage's active node
  const activeNodePos = useMemo(() => {
    const rad = ((displayedIndex * anglePerItem - 90) * Math.PI) / 180;
    const radius = 126;
    const hubRadius = 56;
    return {
      cx: 170 + radius * Math.cos(rad),
      cy: 170 + radius * Math.sin(rad),
      hx: 170 + hubRadius * Math.cos(rad),
      hy: 170 + hubRadius * Math.sin(rad),
    };
  }, [displayedIndex, anglePerItem]);

  return (
    <div
      className="relative flex flex-col justify-between rounded-2xl border select-none overflow-hidden h-full"
      style={{
        backgroundColor: isCurrentActive ? '#0E1726' : '#09111E',
        borderColor: isCurrentActive ? 'rgba(56, 189, 248, 0.34)' : 'rgba(148, 163, 184, 0.2)',
        boxShadow: isCurrentActive
          ? '0 22px 48px -12px rgba(0, 0, 0, 0.72), 0 0 28px rgba(37, 99, 235, 0.18), inset 0 1px 0 rgba(186, 230, 253, 0.14)'
          : '0 14px 32px -12px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Top Dial Header Strip */}
      <div
        className="px-4 py-2.5 border-b flex items-center justify-between gap-2 shrink-0"
        style={{
          borderColor: 'rgba(56, 189, 248, 0.16)',
          backgroundColor: 'rgba(7, 11, 20, 0.55)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: isCurrentActive ? '#38BDF8' : '#64748B',
              boxShadow: isCurrentActive ? '0 0 10px rgba(56, 189, 248, 0.85)' : 'none',
            }}
          />
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#7DD3FC] truncate">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-mono font-semibold text-[#94A3B8] shrink-0">
          {sublabel}
        </span>
      </div>

      {/* Circular Orbital Dial Assembly */}
      <div
        className={`relative flex-1 flex items-center justify-center overflow-hidden ${
          compact ? 'py-3 px-2 min-h-[250px]' : 'py-3 px-3 min-h-[285px] xl:min-h-[320px]'
        }`}
      >
        {/* Subtle Static Concentric Reference Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`rounded-full border border-dashed ${
              compact ? 'w-[225px] h-[225px]' : 'w-[250px] h-[250px] xl:w-[300px] xl:h-[300px]'
            }`}
            style={{ borderColor: 'rgba(56, 189, 248, 0.16)' }}
          />
          <div
            className={`absolute rounded-full border ${
              compact ? 'w-[175px] h-[175px]' : 'w-[195px] h-[195px] xl:w-[235px] xl:h-[235px]'
            }`}
            style={{ borderColor: 'rgba(56, 189, 248, 0.12)' }}
          />
        </div>

        {/* Dial Geometry Box */}
        <div
          className={`relative aspect-square flex items-center justify-center max-w-full ${
            compact
              ? 'w-[244px] h-[244px]'
              : 'w-[256px] h-[256px] lg:w-[266px] lg:h-[266px] xl:w-[306px] xl:h-[306px]'
          }`}
        >
          {/* Rotating Orbital Ring + Counter-Rotated Stage Nodes */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: targetRotation }}
            transition={
              prefersReducedMotion
                ? { duration: 0.08 }
                : { type: 'spring', stiffness: 210, damping: 25, mass: 0.72 }
            }
          >
            <svg className="w-full h-full pointer-events-none overflow-visible" viewBox="0 0 340 340">
              <defs>
                <linearGradient id={arcGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="50%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
                <linearGradient id={laserGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
                  <stop offset="65%" stopColor="#38BDF8" stopOpacity="0.58" />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.95" />
                </linearGradient>
                <filter id={glowFilterId} x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="3.2" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* 36 Precision Chronograph Ticks */}
              <g style={{ color: 'rgba(148, 163, 184, 0.32)' }}>
                {dialTicks.map((tick) => (
                  <line
                    key={tick.id}
                    x1={tick.x1}
                    y1={tick.y1}
                    x2={tick.x2}
                    y2={tick.y2}
                    stroke="currentColor"
                    strokeWidth={tick.isCardinal ? 2 : tick.isMajor ? 1.5 : 1}
                    strokeOpacity={tick.isCardinal ? 0.88 : tick.isMajor ? 0.56 : 0.3}
                  />
                ))}
              </g>

              {/* Main Dashed Guide Orbit */}
              <circle
                cx="170"
                cy="170"
                r="126"
                fill="none"
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="1.75"
                strokeDasharray="4 6"
              />

              {/* Glowing Active Arc */}
              <circle
                cx="170"
                cy="170"
                r="126"
                fill="none"
                stroke={`url(#${arcGradId})`}
                strokeWidth="3.5"
                strokeDasharray="72 280"
                strokeDashoffset={-displayedIndex * (791 / count)}
                filter={`url(#${glowFilterId})`}
                className="transition-all duration-300 ease-out"
              />

              {/* Laser Beam from Hub to Current Node */}
              <line
                x1={activeNodePos.hx}
                y1={activeNodePos.hy}
                x2={activeNodePos.cx}
                y2={activeNodePos.cy}
                stroke={`url(#${laserGradId})`}
                strokeWidth="2"
                strokeDasharray="2.5 3.5"
                filter={`url(#${glowFilterId})`}
              />
            </svg>

            {/* Orbital Node Buttons */}
            {items.map((item, idx) => {
              const nodeAngle = idx * anglePerItem - 90;
              const rad = (nodeAngle * Math.PI) / 180;
              const radius = 126;
              const cx = 170 + radius * Math.cos(rad);
              const cy = 170 + radius * Math.sin(rad);
              const isNodeSelected = idx === displayedIndex;
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
                  <motion.div
                    animate={{ rotate: -targetRotation }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.08 }
                        : { type: 'spring', stiffness: 210, damping: 25, mass: 0.72 }
                    }
                    className="relative flex items-center justify-center"
                  >
                    {/* Active Luminous Halo (calm radial glow, zero pulse strobing) */}
                    {isNodeSelected && (
                      <span
                        aria-hidden="true"
                        className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, rgba(37, 99, 235, 0.25) 60%, transparent 100%)',
                          filter: 'blur(5px)',
                        }}
                      />
                    )}

                    <button
                      type="button"
                      tabIndex={isInteractive ? 0 : -1}
                      onClick={(e) => {
                        if (!isInteractive) return;
                        e.stopPropagation();
                        onSelectStage(idx);
                      }}
                      onMouseEnter={() => isInteractive && setHoveredNodeIdx(idx)}
                      onMouseLeave={() => setHoveredNodeIdx(null)}
                      aria-label={`Select stage ${item.number}: ${item.title}`}
                      aria-pressed={isNodeSelected}
                      className={`relative flex items-center justify-center rounded-xl transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                        isInteractive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                      } ${
                        isNodeSelected
                          ? compact
                            ? 'w-11 h-11'
                            : 'w-12 h-12 xl:w-13 xl:h-13'
                          : compact
                          ? 'w-8.5 h-8.5'
                          : 'w-9 h-9 xl:w-10 xl:h-10'
                      }`}
                      style={
                        isNodeSelected
                          ? {
                              background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 55%, #38BDF8 100%)',
                              color: '#FFFFFF',
                              border: '1.5px solid rgba(186, 230, 253, 0.85)',
                              boxShadow: '0 8px 22px rgba(37, 99, 235, 0.45)',
                            }
                          : {
                              backgroundColor: '#0A1324',
                              color: '#CBD5E1',
                              border: '1px solid rgba(148, 163, 184, 0.28)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45)',
                            }
                      }
                    >
                      <NodeIcon className={isNodeSelected ? 'w-5 h-5' : 'w-4 h-4'} />

                      <span
                        className="absolute -bottom-1 -right-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                        style={
                          isNodeSelected
                            ? {
                                backgroundColor: '#070B14',
                                color: '#7DD3FC',
                                border: '1px solid rgba(56, 189, 248, 0.65)',
                              }
                            : {
                                backgroundColor: '#132038',
                                color: '#94A3B8',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                              }
                        }
                      >
                        {item.number}
                      </span>
                    </button>

                    {/* Hover Tooltip */}
                    <AnimatePresence>
                      {isInteractive && isNodeHovered && !isNodeSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.14 }}
                          className="absolute bottom-full mb-2 px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold whitespace-nowrap shadow-xl pointer-events-none z-30"
                          style={{
                            backgroundColor: '#070B14',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                          }}
                        >
                          {item.title}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>

          {/* Central Holographic Hub Core */}
          <div
            className={`relative z-10 rounded-full flex flex-col items-center justify-center p-2.5 text-center pointer-events-none ${
              compact ? 'w-24 h-24' : 'w-24 h-24 xl:w-28 xl:h-28'
            }`}
            style={{
              backgroundColor: '#070B14',
              border: '1.5px solid rgba(56, 189, 248, 0.45)',
              boxShadow: '0 0 32px rgba(37, 99, 235, 0.28), inset 0 0 18px rgba(56, 189, 248, 0.1)',
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <HubIcon className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#7DD3FC]">
                STAGE {currentItem?.number || '01'}
              </span>
            </div>

            <div className="text-xs font-extrabold text-white truncate max-w-[84px] xl:max-w-[98px] leading-tight tracking-tight">
              {currentItem?.title}
            </div>

            <div className="text-[9px] font-medium text-[#94A3B8] mt-0.5 truncate max-w-[78px] xl:max-w-[92px]">
              {currentItem?.tagline || sublabel}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stage Quick Summary Bar */}
      <div
        className="px-4 py-2.5 border-t flex items-center justify-between gap-2 text-[11px] font-mono shrink-0"
        style={{
          borderColor: 'rgba(56, 189, 248, 0.16)',
          backgroundColor: 'rgba(7, 11, 20, 0.72)',
        }}
      >
        <span className="text-[#94A3B8] truncate">
          {currentItem?.tagline || label}
        </span>
        <span className="text-[#7DD3FC] font-bold shrink-0">
          {currentItem?.number} / {String(count).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
