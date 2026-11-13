import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight, Disc } from 'lucide-react';
import { SpiralAtmosphereBackdrop } from './SpiralAtmosphereBackdrop';

export interface SpiralStageItemDef {
  id: string;
  number: string;
  title: string;
  tagline?: string;
  description?: string;
  badge?: string;
  icon: React.ElementType;
}

export interface SpiralWorkflowStageProps {
  items: SpiralStageItemDef[];
  activeIndex: number;
  /** Continuous normalized progress across 0 .. items.length - 1 from useSpiralScroll */
  progress: number;
  /** Current tick phase within transition (0..3) */
  currentTickStep?: number;
  onActiveChange: (index: number) => void;
  label?: string;
  sublabel?: string;
  /** Compact mode renders tighter card & arc geometry for mobile/tablet inline showcase */
  compact?: boolean;
  className?: string;
}

/**
 * 3D Orbital Spiral Card Stage
 *
 * Positions cards along a continuous 3D helical curve revolving around a stationary
 * central ThreeUI `atmospheric-blade` vertical laser pole inside `.shader-frame`.
 *
 * - No `backdrop-filter` / `backdrop-blur` placed over live WebGL canvases.
 * - Direct click on any visible peeking card or step pill smoothly locks onto that stage.
 */
export const SpiralWorkflowStage: React.FC<SpiralWorkflowStageProps> = ({
  items,
  activeIndex,
  progress,
  currentTickStep = 3,
  onActiveChange,
  label = 'Store Flow',
  sublabel = '3-Tick Spiral Orbit',
  compact = false,
  className = '',
}) => {
  const count = items.length;
  const activeItem = items[activeIndex] || items[0];

  const handleNext = useCallback(() => {
    onActiveChange(Math.min(count - 1, activeIndex + 1));
  }, [activeIndex, count, onActiveChange]);

  const handlePrev = useCallback(() => {
    onActiveChange(Math.max(0, activeIndex - 1));
  }, [activeIndex, onActiveChange]);

  const radiusX = compact ? 72 : 108;
  const stepY = compact ? 32 : 50;

  return (
    <div
      className={`ellic-spiral-stage relative flex flex-col justify-between rounded-3xl bg-slate-950 text-white border border-sky-400/25 shadow-2xl overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: '#070B14',
        borderColor: 'rgba(56, 189, 248, 0.25)',
      }}
    >
      {/* Stationary ThreeUI Laser Blade + Orbital Gallery WebGL Backdrop */}
      <SpiralAtmosphereBackdrop liteMode={compact} />

      {/* Top Subtle Stage Identity Bar */}
      <div className="relative z-20 px-4 sm:px-5 pt-3.5 pb-1 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.85)]" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-sky-300 truncate">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-mono font-semibold text-slate-400 shrink-0">
          {sublabel}
        </span>
      </div>

      {/* Center 3D Perspective Spiral Card Deck */}
      <div
        className={`relative z-20 flex-1 flex items-center justify-center px-3 sm:px-5 ${
          compact ? 'min-h-[195px] sm:min-h-[220px] py-2' : 'min-h-[265px] lg:min-h-[300px] py-3'
        }`}
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {items.map((item, idx) => {
            const d = idx - progress;
            const absD = Math.abs(d);

            // Cull far off-arc cards from DOM layout overhead while preserving smooth entry/exit
            if (absD > 1.55) return null;

            const orbitAngle = d * 1.15;
            const tx = Math.sin(orbitAngle) * radiusX;
            const ty = d * stepY - absD * (compact ? 4 : 7);
            const tz = -Math.min(180, absD * 116);
            const rotY = Math.max(-34, Math.min(34, -d * 28));
            const rotZ = Math.max(-6, Math.min(6, d * 3.2));
            const scale = Math.max(0.74, 1 - absD * 0.145);
            const opacity = absD > 1.45 ? 0 : Math.max(0.22, 1 - absD * 0.56);
            const zIndex = Math.round(40 - absD * 14);
            const isCenterFocus = absD < 0.35;
            const CardIcon = item.icon || Disc;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onActiveChange(idx)}
                aria-label={`Select ${item.number}: ${item.title}`}
                aria-pressed={idx === activeIndex}
                style={{
                  position: 'absolute',
                  width: compact ? 'min(82%, 250px)' : 'min(78%, 296px)',
                  transform: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
                  opacity: Number(opacity.toFixed(3)),
                  zIndex,
                  backgroundColor: isCenterFocus ? '#0E1726' : '#09111E',
                  borderColor: isCenterFocus ? 'rgba(56, 189, 248, 0.55)' : 'rgba(148, 163, 184, 0.22)',
                  boxShadow: isCenterFocus
                    ? '0 22px 44px -12px rgba(0, 0, 0, 0.72), 0 0 28px rgba(37, 99, 235, 0.28)'
                    : '0 12px 26px -10px rgba(0, 0, 0, 0.55)',
                  transition: 'border-color 180ms ease, box-shadow 180ms ease',
                }}
                className="ellic-spiral-card text-left rounded-2xl border p-3.5 sm:p-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {/* Top Row: Stage Number + Category Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`flex items-center justify-center rounded-xl shrink-0 border ${
                        compact ? 'w-8 h-8' : 'w-9 h-9'
                      } ${
                        isCenterFocus
                          ? 'bg-blue-600/20 border-sky-400/50 text-sky-300'
                          : 'bg-slate-900 border-slate-700/60 text-slate-400'
                      }`}
                    >
                      <CardIcon className={compact ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-sky-400 tracking-wider">
                      STAGE {item.number}
                    </span>
                  </div>

                  {item.tagline && (
                    <span
                      className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md truncate max-w-[130px] border"
                      style={{
                        backgroundColor: 'rgba(37, 99, 235, 0.16)',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        color: '#7DD3FC',
                      }}
                    >
                      {item.tagline}
                    </span>
                  )}
                </div>

                {/* Main Card Title */}
                <div
                  className={`font-extrabold text-white tracking-tight leading-snug ${
                    compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                  }`}
                >
                  {item.title}
                </div>

                {/* Compact Description on Foreground / Desktop Cards */}
                {item.description && !compact && (
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Bottom Orbital Position Strip */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-sky-300/90 font-semibold">
                    {isCenterFocus ? 'Active Focus' : d > 0 ? 'Next in Orbit' : 'Completed'}
                  </span>
                  <span>
                    {idx + 1} of {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Rotary Dock & 3-Tick Progress Track (Zero backdrop-blur over WebGL) */}
      <div
        className="relative z-20 px-3.5 sm:px-5 py-2.5 border-t border-slate-800/90 flex items-center justify-between gap-2"
        style={{ backgroundColor: '#0A101C' }}
      >
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous stage"
          className="p-1.5 sm:p-2 rounded-xl border border-slate-700/80 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-sky-400/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Step Nodes + Subtle Tick Meter */}
        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto max-w-full py-0.5 scrollbar-none">
            {items.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onActiveChange(idx)}
                  aria-label={`Jump to stage ${item.number}: ${item.title}`}
                  className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
                    isActive
                      ? 'w-7 bg-gradient-to-r from-blue-500 to-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.55)]'
                      : idx < activeIndex
                      ? 'w-3 bg-blue-500/50 hover:bg-blue-400'
                      : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                  title={`${item.number}. ${item.title}`}
                />
              );
            })}
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <span className="truncate max-w-[140px] sm:max-w-none text-slate-300 font-semibold">
              {activeItem?.number} · {activeItem?.title}
            </span>
            {!compact && (
              <span className="hidden sm:inline text-sky-400/80">
                Orbit {currentTickStep}/3
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={activeIndex === count - 1}
          aria-label="Next stage"
          className="p-1.5 sm:p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer flex items-center justify-center shadow-md shadow-blue-500/20 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
