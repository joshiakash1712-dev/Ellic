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
  const collarY = 22 + pulseOffset * 56;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-y-0 left-1/2 flex flex-col items-center justify-between"
      style={{
        width: compact ? '38px' : '56px',
        transform: 'translate3d(-50%, 0, 0px)',
        zIndex: 24,
      }}
    >
      {/* Top Architectural Collar Plinth */}
      <div
        className="w-10 h-3 rounded-full shrink-0"
        style={{
          background:
            'linear-gradient(90deg, #060A14 0%, #16253E 30%, rgba(56, 189, 248, 0.55) 50%, #16253E 70%, #060A14 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 0 18px rgba(37, 99, 235, 0.32)',
        }}
      />

      {/* Ambient Cyan/Blue Edge Aura Behind Cylinder */}
      <div
        className="absolute inset-y-3 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: compact ? '26px' : '42px',
          background:
            'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.24) 0%, rgba(37, 99, 235, 0.14) 48%, transparent 80%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Main Brushed Dark-Navy Cylindrical Shaft */}
      <div
        className="relative flex-1 my-0.5 rounded-full overflow-hidden"
        style={{
          width: compact ? '12px' : '18px',
          background:
            'linear-gradient(90deg, #040812 0%, #0D192D 22%, #1D3557 42%, rgba(56, 189, 248, 0.42) 52%, #12233E 68%, #040812 100%)',
          boxShadow:
            '0 0 22px rgba(37, 99, 235, 0.28), inset 1px 0 2px rgba(56, 189, 248, 0.4), inset -1px 0 2px rgba(37, 99, 235, 0.3)',
        }}
      >
        {/* Crisp Left & Right Metallic Rim-Light Hairlines */}
        <div
          className="absolute inset-y-0 left-[2px] w-[1px]"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.55) 18%, rgba(186, 230, 253, 0.78) 50%, rgba(56, 189, 248, 0.55) 82%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-y-0 right-[2px] w-[1px]"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(37, 99, 235, 0.45) 20%, rgba(56, 189, 248, 0.52) 50%, rgba(37, 99, 235, 0.45) 80%, transparent 100%)',
          }}
        />

        {/* Machined Cylindrical Structural Bands */}
        {[18, 38, 62, 82].map((pct) => (
          <div
            key={pct}
            className="absolute inset-x-0 h-[2px]"
            style={{
              top: `${pct}%`,
              background:
                'linear-gradient(90deg, rgba(4, 8, 18, 0.9), rgba(56, 189, 248, 0.45), rgba(4, 8, 18, 0.9))',
            }}
          />
        ))}

        {/* Orbit Phase Bearing Collar Ring */}
        <div
          className="absolute inset-x-0 h-[5px] transition-all duration-150 ease-out"
          style={{
            top: `${collarY}%`,
            background:
              'linear-gradient(90deg, rgba(37, 99, 235, 0.45), rgba(186, 230, 253, 0.92), rgba(56, 189, 248, 0.5))',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.7)',
          }}
        />
      </div>

      {/* Bottom Architectural Plinth */}
      <div
        className="w-12 h-3.5 rounded-full shrink-0"
        style={{
          background:
            'linear-gradient(90deg, #060A14 0%, #16253E 28%, rgba(56, 189, 248, 0.52) 50%, #16253E 72%, #060A14 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 0 22px rgba(37, 99, 235, 0.35)',
        }}
      />
    </div>
  );
};
