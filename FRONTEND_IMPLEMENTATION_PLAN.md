# ELLIC BUSINESS OS — FRONTEND IMPLEMENTATION PLAN

## Phase-by-Phase Execution Roadmap

### Phase 1 — Reconnaissance & Baseline Documentation (Completed)
- Inspect routing, header, footer, hero, problem strip, all 5 spiral demonstration sections, modals, banners, ThreeUI shaders, `src/index.css`, and Vitest suites.
- Produce `FRONTEND_AUDIT.md`, `FRONTEND_IMPLEMENTATION_PLAN.md`, and `FRONTEND_PROGRESS.md`.

### Phase 2 — Three-Tick Scroll Engine & Performance Optimization
- **Files**: `src/hooks/useSpiralScroll.ts`
- Convert `TICKS_PER_STAGE` to `3` (`TICK_STEP = 1 / 3`) with explicit 3-tick transition phases (`settled`, `tick1-preview`, `tick2-orbit`, `tick3-settle`) supporting bidirectional forward & reverse scrolling, magnetic stage snapping, click-to-jump stage selection, and keyboard navigation (`ArrowDown`/`ArrowUp`/`ArrowRight`/`ArrowLeft`).
- Gate window `wheel` handling via `IntersectionObserver` viewport activity tracking (`rootMargin: '40px 0px'`) so out-of-viewport spiral sections execute zero DOM layout reads during normal page scrolling.

### Phase 3 — Unified 3D Helical Spiral Composition
- **Files**:
  - `src/components/landing/UnifiedSpiralShowcase.tsx`
  - `src/components/landing/SpiralCentralPole.tsx`
  - `src/components/landing/SpiralDialPanel.tsx`
  - `src/components/landing/SpiralAtmosphereBackdrop.tsx`
- Implement `computeThreeTickPose(stageIndex, activeIndex, transitionProgress, totalStages, scrollDirection, reduceMotion)` so the connected Left Dial + Helical Coupler + Right Simulator assembly orbits smoothly in 3D around the stationary cylindrical center pole (`Z = 0`):
  - **Tick 1 (`1/3`)**: Incoming assembly peeks along the rear orbital helix (`tz < 0`, dimmed preview scale, non-colliding lateral offset); active assembly remains crisp at foreground center.
  - **Tick 2 (`2/3`)**: Active assembly glides outward around one wing behind `Z = 0` while incoming swings cleanly forward around the opposite wing into prominence; solid `#070B14`/`#0E1726` chassis prevents overlapping bleed-through.
  - **Tick 3 (`3/3`)**: Incoming locks dead-center (`tx=0, ty=0, rotY=0, scale=1, opacity=1`); outgoing settles invisibly/cleanly behind the foreground card (`opacity <= 0.12`) with zero double text overlap, then commits `activeIndex`.
- Upgrade `SpiralCentralPole.tsx` with architectural steel cylinder flanges, brushed vertical rim glow, and a subtle active-angle indicator ring.
- Tighten `SpiralAtmosphereBackdrop.tsx` WebGL `IntersectionObserver` bounds + context-loss fallback.

### Phase 4 — Restore Synchronization & Polish Across All 5 Demonstration Sections
- **Files**:
  - `src/components/landing/ConnectedWorkflow.tsx`
  - `src/components/landing/CoreCapabilities.tsx`
  - `src/components/landing/HowItWorks.tsx`
  - `src/components/landing/WhoItsFor.tsx`
  - `src/components/landing/ProductPreview.tsx`
- Restore consistent bottom stage navigation + 3-tick progress dock across **all 5** sections (removing `hideBottomDock`).
- Harmonize simulator accents to Ellic Cobalt/Cyan (`#2563EB`/`#38BDF8`), ensure clean contrast and mobile responsiveness, while preserving every single stage item count and business data structure (`6`, `6`, `3`, `5`, `5`).

### Phase 5 & 6 — Visual Identity, Layout Hierarchy & Responsive Hardening (`80%–150%` Zoom)
- **Files**:
  - `src/components/landing/LandingHeader.tsx`
  - `src/components/landing/HeroSection.tsx`
  - `src/components/landing/ProblemSection.tsx`
  - `src/components/landing/FinalCTA.tsx`
  - `src/components/landing/FAQSection.tsx`
  - `src/components/landing/LandingFooter.tsx`
  - `src/index.css`
- Lower desktop nav & CTA breakpoint in `LandingHeader.tsx` from `xl:flex` (`1280px`) to `lg:flex` (`1024px`) with tight horizontal fit + `whitespace-nowrap` so `1024px+` and `125%–150%` browser zoom preserve the clean desktop header without collapsing into a drawer or wrapping.
- Eliminate decorative pulsing/ping dots, floating pill clutter, `Sparkles` icons, and heavy `border-2 border-slate-400` wireframe outlines.
- Apply `text-wrap: balance` to primary display headlines and standardize `1px` crisp surface borders across dark & light modes.

### Phase 7 & 8 — Conversion Funnel, Modals, Accessibility & Trust Polish
- **Files**:
  - `src/components/landing/modals/MarketingModal.tsx`
  - `src/components/landing/modals/GetStartedModal.tsx`
  - `src/components/landing/modals/SignInModal.tsx`
  - `src/components/landing/modals/ContactModal.tsx`
  - `src/components/legal/CookieConsentBanner.tsx`
  - `src/components/landing/guide/FirstTimeGuideBanner.tsx`
- Unify modal primary buttons, steppers, focus rings, and links from off-brand `emerald`/`teal` to Ellic `#2563EB` Cobalt / `#38BDF8` Sky (reserving green strictly for completed check states).
- Add missing `<label htmlFor>` <-> `id`, `aria-label` on `role="switch"` and FAQ search `<input>`, accessible keyboard buttons for billing toggle labels, and compact mobile bottom chrome (`CookieConsentBanner` & `FirstTimeGuideBanner`) to avoid colliding with `BackToTop`.

### Phase 9 — Comprehensive Verification & Final Reporting
- **Files**: `src/__tests__/spiralShowcase.test.ts`, `FRONTEND_PROGRESS.md`, `FRONTEND_FINAL_REPORT.md`
- Update & expand `src/__tests__/spiralShowcase.test.ts` to cover 3-tick helical state transitions (Ticks 1–3 forward/reverse), non-ghosting z-order opacity rules, all 5 demonstration sections + docks, header/hero/pricing/FAQ/modals SSR & ARIA checks.
- Run `npx vitest run`, `compile_applet`, `lint_applet`, dev server HTTP checks, and publish honest `FRONTEND_FINAL_REPORT.md`.
