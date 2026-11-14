import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConnectedWorkflow } from '../components/landing/ConnectedWorkflow';
import { CoreCapabilities } from '../components/landing/CoreCapabilities';
import { HowItWorks } from '../components/landing/HowItWorks';
import { WhoItsFor } from '../components/landing/WhoItsFor';
import { ProductPreview } from '../components/landing/ProductPreview';
import { computeThreeTickPose } from '../components/landing/UnifiedSpiralShowcase';
import { TICKS_PER_STAGE, getTransitionStateFromTick } from '../hooks/useSpiralScroll';
import { HeroSection } from '../components/landing/HeroSection';
import { FinalCTA } from '../components/landing/FinalCTA';
import { FAQSection } from '../components/landing/FAQSection';
import { LandingFooter } from '../components/landing/LandingFooter';
import { ContactModal } from '../components/landing/modals/ContactModal';

const SECTION_CASES = [
  {
    name: 'ConnectedWorkflow',
    Component: ConnectedWorkflow,
    sectionId: 'workflow',
    expectedHeading: 'How data flows through your store.',
    expectedCount: 6,
    expectedStageTitles: ['Products', 'Customers', 'Billing', 'Payments', 'Inventory', 'Records'],
    simulatorTitle: 'Workflow Simulator',
  },
  {
    name: 'CoreCapabilities',
    Component: CoreCapabilities,
    sectionId: 'features',
    expectedHeading: 'Six tools unified into one calm platform.',
    expectedCount: 6,
    expectedStageTitles: [
      'Billing &amp; POS',
      'Products &amp; Inventory',
      'Customers &amp; Khata',
      'Payments &amp; Settlements',
      'Team &amp; Access Control',
      'Reports &amp; Records',
    ],
    simulatorTitle: 'Live Capability Monitor',
  },
  {
    name: 'HowItWorks',
    Component: HowItWorks,
    sectionId: 'how-it-works',
    expectedHeading: 'Up and running in minutes.',
    expectedCount: 3,
    expectedStageTitles: ['Add your products', 'Bill in sub-seconds', 'Stay in sync automatically'],
    simulatorTitle: 'Live Implementation Monitor',
  },
  {
    name: 'WhoItsFor',
    Component: WhoItsFor,
    sectionId: 'who-its-for',
    expectedHeading: 'Tailored for your specific retail floor.',
    expectedCount: 5,
    expectedStageTitles: [
      'Supermarkets &amp; Grocery',
      'Retail &amp; Fashion',
      'Hardware &amp; Electricals',
      'Pharmacies &amp; Wellness',
      'Wholesale &amp; B2B Supply',
    ],
    simulatorTitle: 'Live Industry Profile',
    extraAnchorId: 'solutions',
  },
  {
    name: 'ProductPreview',
    Component: ProductPreview,
    sectionId: 'product',
    expectedHeading: 'Designed for speed at the counter.',
    expectedCount: 5,
    expectedStageTitles: ['Billing POS', 'Inventory', 'Khata CRM', 'Dashboard', 'Reports &amp; GST'],
    simulatorTitle: 'Ellic Enterprise · Billing POS',
  },
];

describe('Synchronized 3-Tick 3D Spiral Showcase — All 5 Interactive Sections', () => {
  it.each(SECTION_CASES)(
    '$name renders unified two-panel helical assembly, stationary pole, and 3-tick bottom dock',
    ({ Component, sectionId, expectedHeading, expectedCount, expectedStageTitles, simulatorTitle, extraAnchorId }) => {
      const html = renderToStaticMarkup(React.createElement(Component));

      expect(html).toContain(`id="${sectionId}"`);
      expect(html).toContain('data-work-wheel="true"');
      expect(html).toContain('ellic-spiral-section');

      if (extraAnchorId) {
        expect(html).toContain(`id="${extraAnchorId}"`);
      }

      expect(html).toContain(expectedHeading);

      for (const title of expectedStageTitles) {
        expect(html).toContain(title);
      }

      // Unified connected left-dial + coupler + right-simulator assembly settled crisp in 2D focal plane
      expect(html).toContain('data-spiral-assembly="0"');
      expect(html).toContain('data-in-front="true"');
      expect(html).toContain('data-active="true"');
      expect(html).toContain('data-settled="true"');
      expect(html).toContain('transform:none');
      expect(html).toContain('filter:none');
      expect(html).toContain('will-change:auto');
      expect(html).not.toContain('backdrop-filter');
      expect(html).toContain('STAGE 01');
      expect(html).toContain(simulatorTitle);
      expect(html).toContain(`1 / ${expectedCount}`);

      // Removed debug overlays & deleted bottom navigation dock remain absent across all 5 sections
      expect(html).not.toContain('data-spiral-debug-overlay');
      expect(html).not.toContain('5-Tick Debug');
      expect(html).not.toContain('LOCKED · 3/3');

      // Stationary center pole & ThreeUI backdrop markers
      expect(html).toContain('translate3d(-50%, 0, 0px)');
      expect(html).toContain('shader-frame');

      const ids = Array.from(html.matchAll(/<linearGradient id="([^"]+)"/g)).map((m) => m[1]);
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ids).size).toBe(ids.length);
    }
  );
});

describe('3-Tick Transition State Mapping', () => {
  it('enforces TICKS_PER_STAGE === 3 and maps ticks cleanly', () => {
    expect(TICKS_PER_STAGE).toBe(3);
    expect(getTransitionStateFromTick(0, true)).toBe('SETTLED');
    expect(getTransitionStateFromTick(2, true)).toBe('SETTLED');
    expect(getTransitionStateFromTick(1, false)).toBe('TICK_1_PREVIEW');
    expect(getTransitionStateFromTick(2, false)).toBe('TICK_2_ORBIT');
    expect(getTransitionStateFromTick(3, false)).toBe('TICK_3_SETTLE');
  });
});

describe('3-Tick Choreography Pose Verification', () => {
  const swing = 104;

  it('Tick 0 (0.0): active stage settled dead-center at native Z=0 focal plane with zero blur', () => {
    const settled = computeThreeTickPose(0, 0, 0, swing)!;
    const neighbor = computeThreeTickPose(1, 0, 0, swing);

    expect(settled.tx).toBe(0);
    expect(settled.ty).toBe(0);
    expect(settled.tz).toBe(0);
    expect(settled.scale).toBe(1);
    expect(settled.rotY).toBe(0);
    expect(settled.opacity).toBe(1);
    expect(settled.hidden).toBe(false);
    expect(settled.inFrontOfPole).toBe(true);
    expect(settled.isCenterFocus).toBe(true);
    expect(neighbor).toBeNull();
  });

  it('Tick 1 (1/3): incoming enters rear orbital wing behind stationary pole', () => {
    const outgoing = computeThreeTickPose(0, 0, 1 / 3, swing)!;
    const incoming = computeThreeTickPose(1, 0, 1 / 3, swing)!;

    expect(outgoing.opacity).toBe(1);
    expect(outgoing.tz).toBeGreaterThan(0);

    expect(incoming.hidden).toBe(false);
    expect(incoming.inFrontOfPole).toBe(false);
    expect(incoming.tx).toBeGreaterThan(80);
    expect(incoming.tz).toBeLessThan(0);
    expect(incoming.opacity).toBeGreaterThan(0.5);
  });

  it('Tick 2 (2/3): mutual helical orbit brings incoming forward and recedes outgoing behind pole', () => {
    const outgoing = computeThreeTickPose(0, 0, 2 / 3, swing)!;
    const incoming = computeThreeTickPose(1, 0, 2 / 3, swing)!;

    expect(incoming.hidden).toBe(false);
    expect(incoming.inFrontOfPole).toBe(true);
    expect(incoming.opacity).toBe(1);
    expect(incoming.tz).toBeGreaterThan(0);

    expect(outgoing.tz).toBeLessThan(0);
    expect(outgoing.tx).toBeLessThan(-80);
  });

  it('Tick 3 (1.0): full stage commit locks incoming solid front at native Z=0 and hides outgoing', () => {
    const outgoing = computeThreeTickPose(0, 0, 1.0, swing)!;
    const incoming = computeThreeTickPose(1, 0, 1.0, swing)!;

    expect(incoming.tx).toBe(0);
    expect(incoming.ty).toBe(0);
    expect(incoming.rotY).toBe(0);
    expect(incoming.scale).toBe(1);
    expect(incoming.opacity).toBe(1);
    expect(incoming.tz).toBe(0);
    expect(incoming.inFrontOfPole).toBe(true);
    expect(incoming.isCenterFocus).toBe(true);

    expect(outgoing.opacity).toBe(0);
    expect(outgoing.hidden).toBe(true);
    expect(outgoing.tz).toBeLessThan(0);
  });

  it('Symmetric Reverse Scrolling (activeIndex=1 -> 0): matches 3-tick orbit cleanly', () => {
    // Reverse Tick 1 (progress = 2/3)
    const revTick1Incoming = computeThreeTickPose(0, 1, 2 / 3, swing)!;
    expect(revTick1Incoming.hidden).toBe(false);
    expect(revTick1Incoming.inFrontOfPole).toBe(false);
    expect(revTick1Incoming.tx).toBeLessThan(-80);

    // Reverse Tick 2 (progress = 1/3)
    const revTick2Incoming = computeThreeTickPose(0, 1, 1 / 3, swing)!;
    const revTick2Outgoing = computeThreeTickPose(1, 1, 1 / 3, swing)!;
    expect(revTick2Incoming.inFrontOfPole).toBe(true);
    expect(revTick2Incoming.opacity).toBe(1);
    expect(revTick2Outgoing.inFrontOfPole).toBe(false);

    // Reverse Tick 3 (progress = 0.0)
    const revTick3Incoming = computeThreeTickPose(0, 1, 0, swing)!;
    const revTick3Outgoing = computeThreeTickPose(1, 1, 0, swing)!;
    expect(revTick3Incoming.opacity).toBe(1);
    expect(revTick3Incoming.tx).toBe(0);
    expect(revTick3Outgoing.hidden).toBe(true);
    expect(revTick3Outgoing.opacity).toBe(0);
  });

  it('Prefers-reduced-motion locks non-rotational deterministic snap transitions', () => {
    const preMidOutgoing = computeThreeTickPose(0, 0, 0.3, swing, true)!;
    const postMidIncoming = computeThreeTickPose(1, 0, 0.7, swing, true)!;

    expect(preMidOutgoing.rotY).toBe(0);
    expect(preMidOutgoing.tx).toBe(0);
    expect(preMidOutgoing.opacity).toBe(1);

    expect(postMidIncoming.rotY).toBe(0);
    expect(postMidIncoming.tx).toBe(0);
    expect(postMidIncoming.opacity).toBe(1);
  });
});

describe('Public Website Sections — Rendering & Accessibility Smoke Tests', () => {
  it('HeroSection renders primary headline, workspace modes, and CTAs cleanly', () => {
    const html = renderToStaticMarkup(React.createElement(HeroSection, {}));
    expect(html).toContain('id="hero"');
    expect(html).toContain('Run your store operations.');
    expect(html).toContain('Without the complexity.');
    expect(html).toContain('Get Started');
    expect(html).toContain('btn-hero-seehowitworks');
  });

  it('FinalCTA renders billing switch with accessible aria-label and plan pricing', () => {
    const html = renderToStaticMarkup(React.createElement(FinalCTA, {}));
    expect(html).toContain('id="pricing"');
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="Toggle annual or monthly billing"');
    expect(html).toContain('Supermarket &amp; Growth Pro');
  });

  it('FAQSection renders accessible search label and id binding', () => {
    const html = renderToStaticMarkup(React.createElement(FAQSection, {}));
    expect(html).toContain('id="faq"');
    expect(html).toContain('for="faq-search-input"');
    expect(html).toContain('id="faq-search-input"');
  });

  it('LandingFooter renders product, legal, support, and copyright info cleanly', () => {
    const html = renderToStaticMarkup(React.createElement(LandingFooter, {}));
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('Terms of Service');
    expect(html).toContain('All rights reserved.');
  });

  it('ContactModal binds accessible htmlFor/id attributes when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(ContactModal, { isOpen: true, onClose: () => {} })
    );
    expect(html).toContain('for="contact-name-input"');
    expect(html).toContain('id="contact-name-input"');
    expect(html).toContain('for="contact-email-input"');
    expect(html).toContain('id="contact-email-input"');
    expect(html).toContain('for="contact-message-input"');
    expect(html).toContain('id="contact-message-input"');
  });
});
