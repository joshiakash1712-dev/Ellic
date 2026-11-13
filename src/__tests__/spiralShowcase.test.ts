import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConnectedWorkflow } from '../components/landing/ConnectedWorkflow';
import { CoreCapabilities } from '../components/landing/CoreCapabilities';
import { HowItWorks } from '../components/landing/HowItWorks';
import { WhoItsFor } from '../components/landing/WhoItsFor';
import { ProductPreview } from '../components/landing/ProductPreview';
import { computeFiveTickPose } from '../components/landing/UnifiedSpiralShowcase';

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

describe('Synchronized 5-Tick 3D Spiral Showcase — All 5 Interactive Sections', () => {
  it.each(SECTION_CASES)(
    '$name renders unified two-panel helical assemblies around the stationary pole with full business data',
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

      expect(html).toContain('data-spiral-assembly="0"');
      expect(html).toContain('data-in-front="true"');
      expect(html).toContain('data-active="true"');
      expect(html).toContain('STAGE 01');
      expect(html).toContain(simulatorTitle);
      expect(html).toContain(`1 / ${expectedCount}`);
      expect(html).toContain('LOCKED · 5/5');

      expect(html).toContain('translate3d(-50%, 0, 0px)');
      expect(html).toContain('shader-frame');

      const ids = Array.from(html.matchAll(/<linearGradient id="([^"]+)"/g)).map((m) => m[1]);
      expect(ids.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ids).size).toBe(ids.length);
    }
  );
});

describe('5-Tick Choreography Pose Verification', () => {
  const swing = 114;

  it('Tick 1 (0.2): objects behind peek in while front stays solid', () => {
    const front = computeFiveTickPose(0, 0, 0.2, swing)!;
    const incoming = computeFiveTickPose(1, 0, 0.2, swing)!;

    expect(front.opacity).toBe(1);
    expect(front.tz).toBeGreaterThan(0);

    expect(incoming.hidden).toBe(false);
    expect(incoming.opacity).toBeGreaterThan(0.75);
    expect(incoming.tx).toBeGreaterThan(100);
    expect(incoming.inFrontOfPole).toBe(false);
  });

  it('Tick 2 (0.4): incoming objects rotate forward and display prominently', () => {
    const incoming = computeFiveTickPose(1, 0, 0.4, swing)!;

    expect(incoming.hidden).toBe(false);
    expect(incoming.opacity).toBeGreaterThan(0.95);
    expect(incoming.inFrontOfPole).toBe(true);
    expect(incoming.tx).toBeGreaterThan(90);
  });

  it('Tick 3 (0.6): active card is completely centered, non-transparent, and everything behind hides behind it cleanly', () => {
    const front = computeFiveTickPose(0, 0, 0.6, swing)!;
    const incoming = computeFiveTickPose(1, 0, 0.6, swing)!;

    expect(front.tx).toBe(0);
    expect(front.ty).toBe(0);
    expect(front.rotY).toBe(0);
    expect(front.scale).toBe(1);
    expect(front.opacity).toBe(1);
    expect(front.tz).toBeGreaterThan(50);

    expect(incoming.tx).toBe(0);
    expect(incoming.ty).toBe(0);
    expect(incoming.scale).toBeLessThan(0.85);
    expect(incoming.tz).toBeLessThan(0);
    expect(incoming.opacity).toBe(0);
    expect(incoming.hidden).toBe(true);
  });

  it('Tick 4 (0.8): things emerge visibly behind the active front card', () => {
    const front = computeFiveTickPose(0, 0, 0.8, swing)!;
    const incoming = computeFiveTickPose(1, 0, 0.8, swing)!;

    expect(front.opacity).toBe(1);
    expect(front.inFrontOfPole).toBe(true);

    expect(incoming.hidden).toBe(false);
    expect(incoming.opacity).toBeGreaterThan(0.8);
    expect(incoming.tz).toBeLessThan(0);
    expect(incoming.tx).toBeGreaterThan(100);
  });

  it('Tick 5 (1.0): card revolution completes at center foreground', () => {
    const outgoing = computeFiveTickPose(0, 0, 1.0, swing)!;
    const nextCard = computeFiveTickPose(1, 0, 1.0, swing)!;

    expect(outgoing.opacity).toBe(0);
    expect(outgoing.hidden).toBe(true);

    expect(nextCard.tx).toBe(0);
    expect(nextCard.ty).toBe(0);
    expect(nextCard.scale).toBe(1);
    expect(nextCard.opacity).toBe(1);
    expect(nextCard.inFrontOfPole).toBe(true);
  });

  it('Symmetric Reverse Scrolling (activeIndex=1 -> 0): matches 5-tick beats in reverse', () => {
    // Reverse Tick 1 (0.8): Stage 0 peeks out on negative horizontal wing
    const revTick1Incoming = computeFiveTickPose(0, 1, 0.8, swing)!;
    expect(revTick1Incoming.hidden).toBe(false);
    expect(revTick1Incoming.tx).toBeLessThan(-100);

    // Reverse Tick 3 (0.4): Front Stage 1 non-transparent solo, Stage 0 strictly hidden behind
    const revTick3Front = computeFiveTickPose(1, 1, 0.4, swing)!;
    const revTick3Incoming = computeFiveTickPose(0, 1, 0.4, swing)!;
    expect(revTick3Front.opacity).toBe(1);
    expect(revTick3Front.tx).toBe(0);
    expect(revTick3Incoming.hidden).toBe(true);
    expect(revTick3Incoming.opacity).toBe(0);
    expect(revTick3Incoming.tx).toBe(0);
  });
});
