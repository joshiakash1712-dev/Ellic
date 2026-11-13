import React, { Component, useEffect, useRef, useState } from 'react';
import { LaserCollection, Gallery } from '@designcodeio/threeui';

interface WebGLErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  declare readonly props: Readonly<WebGLErrorBoundaryProps>;
  state: WebGLErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

let cachedWebGLSupport: boolean | null = null;

function detectWebGLSupport(): boolean {
  if (cachedWebGLSupport !== null) return cachedWebGLSupport;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    cachedWebGLSupport = Boolean(gl);
  } catch {
    cachedWebGLSupport = false;
  }
  return cachedWebGLSupport;
}

export interface SpiralAtmosphereBackdropProps {
  /** Whether to show only the lightweight CSS + central laser backdrop (e.g. small mobile viewports) */
  liteMode?: boolean;
}

/**
 * ThreeUI Atmospheric Blade + Cylindrical Orbital Backdrop
 *
 * - Mounted cleanly inside `.shader-frame`.
 * - Strictly stationary vertical central laser blade (`pointerEvents: "none"` prevents cursor-reactive tilting).
 * - Calibrated hue (+54deg on atmospheric-blade) so cyan/cobalt matches Ellic's `#2563EB` / `#38BDF8` brand palette.
 * - Viewport-gated via IntersectionObserver so only nearby/visible sections allocate live WebGL contexts.
 * - Instant pure-CSS obsidian + central vertical beam fallback on reduced motion, SSR, or offscreen idle.
 */
export const SpiralAtmosphereBackdrop: React.FC<SpiralAtmosphereBackdropProps> = ({
  liteMode = false,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inViewport, setInViewport] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canUseWebGL, setCanUseWebGL] = useState(false);

  useEffect(() => {
    setCanUseWebGL(detectWebGLSupport());
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInViewport(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visibleInLayout = Boolean(
          entry?.isIntersecting &&
          entry.boundingClientRect.width > 0 &&
          entry.boundingClientRect.height > 0
        );
        setInViewport(visibleInLayout);
      },
      { rootMargin: '260px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const renderWebGL = inViewport && canUseWebGL && !prefersReducedMotion;

  const cssFallbackPole = (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 64% 58% at 50% 50%, rgba(37, 99, 235, 0.22) 0%, rgba(14, 23, 38, 0.72) 56%, #070B14 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[3px] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.45) 22%, rgba(224, 242, 254, 0.92) 50%, rgba(56, 189, 248, 0.45) 78%, transparent 100%)',
          boxShadow: '0 0 28px 6px rgba(56, 189, 248, 0.34), 0 0 64px 12px rgba(37, 99, 235, 0.22)',
        }}
      />
    </>
  );

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="shader-frame pointer-events-none select-none overflow-hidden"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#070B14',
        pointerEvents: 'none',
      }}
    >
      {/* Base Grid + Obsidian Radial Glow (Instant Paint, Zero Shift) */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(56, 189, 248, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.12) 1px, transparent 1px)',
          backgroundSize: '2.5rem 2.5rem',
          maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, #000 50%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, #000 50%, transparent 100%)',
        }}
      />

      {cssFallbackPole}

      {renderWebGL && (
        <WebGLErrorBoundary fallback={cssFallbackPole}>
          {/* Cylindrical orbital depth ribbon (Three.js r149 Gallery) */}
          {!liteMode && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ pointerEvents: 'none', opacity: 0.24 }}
            >
              <Gallery
                speed={0.3}
                scale={1.12}
                opacity={0.75}
                hue={20}
                saturation={0.55}
                brightness={0.62}
                style={{
                  backgroundColor: 'transparent',
                  backgroundImage: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}

          {/* Deep dark scrim preserving foreground card typography contrast over rotating gallery */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 68% 64% at 50% 50%, rgba(7, 11, 20, 0.45) 0%, rgba(7, 11, 20, 0.86) 76%, rgba(7, 11, 20, 0.96) 100%)',
            }}
          />

          {/* Stationary central vertical Atmospheric Laser Blade (pointerEvents="none" guarantees zero cursor tilt) */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ pointerEvents: 'none' }}
          >
            <LaserCollection
              variant="atmospheric-blade"
              speed={0.7}
              size={0.95}
              length={1.2}
              density={0.95}
              opacity={0.92}
              hue={54}
              saturation={1.0}
              brightness={0.95}
              style={{
                pointerEvents: 'none',
                background: 'transparent',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        </WebGLErrorBoundary>
      )}
    </div>
  );
};
