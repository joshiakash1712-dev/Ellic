import React from 'react';

export interface SpiralCentralPoleProps {
  /** Normalized spiral progress 0..(total-1) to animate collar highlight ring subtly without moving the pole itself */
  progress?: number;
  compact?: boolean;
}

/**
 * Stationary Architectural Central Vertical Cylindrical Pole
 *
 * Fixed dead center of the 3D helical showcase. Both the Left Dial Panel
 * and Right Workflow Simulator revolve together as a paired assembly around this
 * immutable axis, passing in front (z > 0) when settled and curving behind (z < 0)
 * during entrance and exit. Strictly stationary — zero cursor tracking.
 */
export const SpiralCentralPole: React.FC<SpiralCentralPoleProps> = ({
  progress = 0,
  compact = false,
}) => {
  const pulseOffset = ((progress % 1) + 1) % 1;
  const collarY = 20 + pulseOffset * 60;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-y-0 left-1/2 flex flex-col items-center justify-between"
      style={{
        width: compact ? '42px' : '64px',
        transform: 'translate3d(-50%, 0, 0px)',
        zIndex: 24,
      }}
    >
      {/* Top Architectural Flange Assembly */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={compact ? 'w-10 h-2.5 rounded-full' : 'w-14 h-3 rounded-full'}
          style={{
            background:
              'linear-gradient(90deg, #050912 0%, #162742 28%, rgba(56, 189, 248, 0.62) 50%, #162742 72%, #050912 100%)',
            border: '1px solid rgba(56, 189, 248, 0.38)',
            boxShadow: '0 4px 18px rgba(37, 99, 235, 0.34)',
          }}
        />
        <div
          className={compact ? 'w-7 h-1.5 rounded-b-md' : 'w-9 h-2 rounded-b-md'}
          style={{
            background: 'linear-gradient(90deg, #060B16, #1E3A8A, #060B16)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          }}
        />
      </div>

      {/* Controlled Cyan/Cobalt Edge Atmosphere Behind Cylinder */}
      <div
        className="absolute inset-y-4 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: compact ? '30px' : '48px',
          background:
            'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.22) 0%, rgba(37, 99, 235, 0.14) 48%, transparent 80%)',
          filter: 'blur(9px)',
        }}
      />

      {/* Main Brushed Steel Cylindrical Shaft */}
      <div
        className="relative flex-1 my-0.5 rounded-sm overflow-hidden"
        style={{
          width: compact ? '14px' : '22px',
          background:
            'linear-gradient(90deg, #030710 0%, #0C182C 20%, #1B3459 38%, rgba(56, 189, 248, 0.45) 50%, #142744 65%, #07101F 86%, #030710 100%)',
          boxShadow:
            '0 0 24px rgba(37, 99, 235, 0.26), inset 1.5px 0 3px rgba(56, 189, 248, 0.45), inset -1.5px 0 3px rgba(37, 99, 235, 0.32)',
        }}
      >
        {/* Crisp Dual Metallic Rim-Light Hairlines */}
        <div
          className="absolute inset-y-0 left-[2px] w-[1px]"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.6) 16%, rgba(186, 230, 253, 0.85) 50%, rgba(56, 189, 248, 0.6) 84%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-y-0 right-[2px] w-[1px]"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(37, 99, 235, 0.45) 18%, rgba(56, 189, 248, 0.56) 50%, rgba(37, 99, 235, 0.45) 82%, transparent 100%)',
          }}
        />

        {/* Precision Cylindrical Structural Rings */}
        {[16, 36, 64, 84].map((pct) => (
          <div
            key={pct}
            className="absolute inset-x-0 h-[2px]"
            style={{
              top: `${pct}%`,
              background:
                'linear-gradient(90deg, rgba(4, 8, 18, 0.92), rgba(56, 189, 248, 0.48), rgba(4, 8, 18, 0.92))',
            }}
          />
        ))}

        {/* Orbit Phase Bearing Collar Ring */}
        <div
          className="absolute inset-x-0 h-[6px] transition-all duration-150 ease-out"
          style={{
            top: `${collarY}%`,
            background:
              'linear-gradient(90deg, rgba(37, 99, 235, 0.55), rgba(186, 230, 253, 0.96), rgba(56, 189, 248, 0.58))',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.72)',
          }}
        />
      </div>

      {/* Bottom Architectural Plinth Base */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={compact ? 'w-7 h-1.5 rounded-t-md' : 'w-9 h-2 rounded-t-md'}
          style={{
            background: 'linear-gradient(90deg, #060B16, #1E3A8A, #060B16)',
            borderTop: '1px solid rgba(56, 189, 248, 0.25)',
          }}
        />
        <div
          className={compact ? 'w-12 h-3 rounded-full' : 'w-16 h-3.5 rounded-full'}
          style={{
            background:
              'linear-gradient(90deg, #050912 0%, #162742 26%, rgba(56, 189, 248, 0.58) 50%, #162742 74%, #050912 100%)',
            border: '1px solid rgba(56, 189, 248, 0.38)',
            boxShadow: '0 0 24px rgba(37, 99, 235, 0.38)',
          }}
        />
      </div>
    </div>
  );
};
