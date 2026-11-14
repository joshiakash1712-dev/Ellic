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
  /** Compact mode skips heavy orbital mesh geometry on narrow mobile screens */
  liteMode?: boolean;
}

/**
 * Full-Section Deep-Navy Spatial Atmosphere Backdrop
 *
 * - Renders inside `.shader-frame` with `pointerEvents: 'none'` so zero cursor tracking occurs.
 * - Combines a precision coordinate grid, ThreeUI Gallery orbital ribbon, and subtle
 *   subdued LaserCollection (`atmospheric-blade`) background accent behind the stationary central pole.
 * - Viewport-gated via IntersectionObserver so only visible/adjacent sections allocate WebGL contexts.
 */
export const SpiralAtmosphereBackdrop: React.FC<SpiralAtmosphereBackdropProps> = ({
  liteMode = false,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inViewport, setInViewport] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canUseWebGL, setCanUseWebGL] = useState(false);
  const [contextLost, setContextLost] = useState(false);

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
    if (!el) return undefined;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    el.addEventListener('webglcontextlost', handleContextLost, true);

    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true);
      return () => el.removeEventListener('webglcontextlost', handleContextLost, true);
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
      { rootMargin: '40px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.removeEventListener('webglcontextlost', handleContextLost, true);
    };
  }, []);

  const renderWebGL = inViewport && canUseWebGL && !prefersReducedMotion && !contextLost;

  const fallbackAtmosphere = (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse 68% 58% at 50% 52%, rgba(37, 99, 235, 0.16) 0%, rgba(14, 23, 38, 0.72) 55%, #070B14 100%)',
      }}
    />
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
      {/* Architectural Spatial Micro-Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(56, 189, 248, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.12) 1px, transparent 1px)',
          backgroundSize: '2.75rem 2.75rem',
          maskImage: 'radial-gradient(ellipse 76% 74% at 50% 54%, #000 45%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 76% 74% at 50% 54%, #000 45%, transparent 100%)',
        }}
      />

      {fallbackAtmosphere}

      {renderWebGL && (
        <WebGLErrorBoundary fallback={fallbackAtmosphere}>
          {/* Cylindrical orbital depth ribbon (Three.js r149 Gallery) */}
          {!liteMode && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ pointerEvents: 'none', opacity: 0.2 }}
            >
              <Gallery
                speed={0.26}
                scale={1.15}
                opacity={0.7}
                hue={20}
                saturation={0.5}
                brightness={0.58}
                style={{
                  backgroundColor: 'transparent',
                  backgroundImage: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}

          {/* Deep vignette scrim safeguarding foreground typography readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 70% 64% at 50% 54%, rgba(7, 11, 20, 0.44) 0%, rgba(7, 11, 20, 0.86) 76%, rgba(7, 11, 20, 0.96) 100%)',
            }}
          />

          {/* Subdued stationary LaserCollection background accent (pointerEvents="none" prevents cursor tilt) */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ pointerEvents: 'none', opacity: 0.34 }}
          >
            <LaserCollection
              variant="atmospheric-blade"
              speed={0.48}
              size={0.85}
              length={1.15}
              density={0.62}
              opacity={0.75}
              hue={54}
              saturation={0.85}
              brightness={0.68}
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
