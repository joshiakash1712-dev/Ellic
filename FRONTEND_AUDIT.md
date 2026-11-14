# ELLIC BUSINESS OS — COMPREHENSIVE FRONTEND AUDIT

**Audit Scope**: Complete public-facing Ellic Business OS website (`/`, `/demo`, `/app`, modals, legal banners, 3D spiral demonstration architecture, stylesheets, and unit tests).
**Brand Tokens Audited**: `#070B14` (Obsidian Canvas), `#0E1726` (Elevated Panel), `#2563EB` (Cobalt Primary), `#38BDF8` (Cyan Highlight).

---

## 1. Existing Defects & Architectural Bugs

1. **Five-Tick vs. Three-Tick Spiral Mismatch (`src/hooks/useSpiralScroll.ts`, `src/components/landing/UnifiedSpiralShowcase.tsx`)**
   - Currently runs `TICKS_PER_STAGE = 5` (`TICK_STEP = 0.2`) instead of a crisp, responsive **3-Tick Helical Scroll Interaction** (`TICKS_PER_STAGE = 3`, `TICK_STEP = 1/3`).
   - Five ticks per stage requires too many scroll impulses across 25 cumulative stages (`6+6+3+5+5`), producing sluggish traversal and awkward intermediate tick blackouts.
2. **Broken Visual Continuity & Ghosting at Intermediate Ticks (`UnifiedSpiralShowcase.tsx`)**
   - `computeFiveTickPose` drops outgoing card `opacity` to `0` on Tick 3 while flashing ghost rear cards on Tick 4 before switching at Tick 5.
   - The left dial panel and right simulator panel lack a visibly connected structural coupler arm linking both cards across the cylindrical pole, weakening the "unified helical assembly rotating around a central pole" metaphor.
   - `SpiralCentralPole.tsx` is a thin static vertical stripe lacking cylindrical 3D depth collars, rim reflections, and stage-angle ring cues.
3. **Missing Bottom Stage Docks on 4 of 5 Demonstration Sections**
   - `ConnectedWorkflow.tsx`, `CoreCapabilities.tsx`, `WhoItsFor.tsx`, and `ProductPreview.tsx` pass `hideBottomDock`, stripping their section-level stage navigation pills and real-time tick state bar, leaving only `HowItWorks.tsx` with a dock. This creates inconsistent UX across identical demonstration sections.
4. **Multiple Always-Active Non-Passive Window Wheel Listeners (`useSpiralScroll.ts`)**
   - All 5 spiral instances register permanent non-passive `window.addEventListener('wheel', ...)` handlers simultaneously, executing `getBoundingClientRect()` DOM measurements across out-of-view sections on every scroll impulse.
5. **Pre-existing Failing Light-Theme Regex Test (`src/__tests__/themeOverrides.test.ts`)**
   - `npm run test` / `vitest` currently fails 2 assertions in pre-existing `src/__tests__/themeOverrides.test.ts` (lines 17 and 55) because `src/index.css` evolved `.ellix-app-shell` light-mode rules and `#CBD5E1`/`#94A3B8` borders after that test file was written.

---

## 2. Visual & Brand Inconsistencies

1. **Off-Brand Emerald/Teal Conversion Modals & Banners**
   - `MarketingModal.tsx`, `GetStartedModal.tsx`, `SignInModal.tsx`, `ContactModal.tsx`, `CookieConsentBanner.tsx`, and `FirstTimeGuideBanner.tsx` use `emerald-600`, `teal-600`, `focus:border-emerald-500`, and `bg-emerald-500/20` as primary brand buttons, badges, and steppers—clashing sharply with the website's `#2563EB` Cobalt / `#38BDF8` Cyan brand identity.
   - Emerald should be reserved strictly for semantic "Completed / Verified" feedback states.
2. **AI-Slop & Wireframe Visual Clutter**
   - Decorative pulsing dots (`animate-pulse`, `animate-ping`, floating colored status dots) appear in `LandingHeader.tsx` (`Support -> Live 24/7` dot & mobile support dot), `HeroSection.tsx` (status badge dot + live ledger ping dot), `ProblemSection.tsx` (rose eyebrow dot), `FinalCTA.tsx` (banner kicker dot), and `FAQSection.tsx` (eyebrow dot).
   - `FinalCTA.tsx` and `LandingHeader.tsx` feature decorative `Sparkles` icons and `rounded-full` pill tags that add visual noise.
   - `HeroSection.tsx`, `ProblemSection.tsx`, and `src/index.css` light-theme rules mix `border-2 border-slate-400` with `border border-slate-200`, producing heavy boxy outlines in daylight mode.

---

## 3. Responsive & Zoom Weaknesses

1. **Header Collapse at `1024px–1279px` & Desktop Zoom (`125%–150%`)**
   - `LandingHeader.tsx` uses `hidden xl:flex` (`>=1280px`) for both primary `<nav>` and desktop auth CTAs (`Launch Free`, `Sign In`, `View Live Demo`). Any `1024px` laptop or `1440px`/`1366px` screen zoomed to `125%–150%` collapses the entire top navigation into the hamburger drawer.
2. **Sticky Bottom Viewport Crowding on `360px` Mobile**
   - `FirstTimeGuideBanner.tsx` and `CookieConsentBanner.tsx` have large vertical padding and wide horizontal actions that crowd narrow mobile viewports alongside `BackToTop.tsx`.
3. **3D Spiral Stage Narrow-Viewport Fit (`360px–768px`)**
   - Compact helical swing and clear readable stacking must remain legible without horizontal overflow across `360px` phones through `1920px+` ultrawide screens and `80%–150%` browser zoom.

---

## 4. Accessibility & Conversion Weaknesses

1. **Missing Accessible Names & Label Bindings**
   - `FinalCTA.tsx` billing switch (`role="switch"`) lacks `aria-label`; monthly/annual labels are non-interactive `<span>` elements instead of `<button>` controls.
   - `FAQSection.tsx` search input lacks a `<label>` or `aria-label`.
   - `GetStartedModal.tsx` and `ContactModal.tsx` `<label>` elements lack `htmlFor` <-> `id` bindings.
2. **Typography & Hero Scannability**
   - Hero headline lacks `text-wrap: balance`, causing awkward line breaks across laptop viewports.
   - Modal trust/persistence messages must clearly and honestly describe local onboarding profile persistence + cloud sync upon sign-in without fabricated metrics.

---

## 5. WebGL & Performance Risks

1. **Multi-Instance WebGL Context Budget (`SpiralAtmosphereBackdrop.tsx`)**
   - All 5 spiral demonstration sections use ThreeUI `Gallery` and `LaserCollection` (`atmospheric-blade`). Having `IntersectionObserver` `rootMargin: '120px 0px'` allows overlapping adjacent sections to hold concurrent WebGL contexts during fast scrolling. Tightening hysteresis (`rootMargin: '40px 0px'`), enforcing `pointer-events-none`, and handling `webglcontextlost` fallback keeps GPU memory safe and prevents dropped frames.
