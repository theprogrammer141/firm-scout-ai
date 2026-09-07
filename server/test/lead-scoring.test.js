import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeLeadScore } from '../src/agents/lead-scoring.js';

describe('computeLeadScore', () => {
  it('returns score components and classification', () => {
    const result = computeLeadScore({
      icp: { target_industry: 'Dental', target_locations: ['Lahore'], business_size: 'Small' },
      research: {
        industryMatch: 'high',
        sizeMatch: true,
        techStackOverlap: 0.7,
        digitalMaturity: 'low',
        websiteSubScores: { presence: 0.2, conversion: 0.1, automation: 0.05, quality: 0.15 },
      },
      opportunities: [
        { title: 'Workflow Automation', description: 'Streamline appointment booking' },
        { title: 'CRM Integration', description: 'Sync patient data' },
        { title: 'API Development', description: 'Build integration layer' },
      ],
    });

    assert.ok(result.total >= 0);
    assert.ok(['HOT', 'WARM', 'COLD'].includes(result.classification));
    assert.ok(typeof result.icpFit === 'number');
    assert.ok(typeof result.digitalGap === 'number');
    assert.ok(typeof result.automationPotential === 'number');
    assert.ok(typeof result.buyingSignals === 'number');
  });

  it('component scores are within expected bounds', () => {
    const result = computeLeadScore({
      icp: { target_industry: 'X' },
      research: {
        industryMatch: 'high',
        sizeMatch: true,
        techStackOverlap: 0.8,
        digitalMaturity: 'low',
        recentFunding: true,
        hiringGrowth: 'increasing',
        socialPresence: 'active',
      },
      opportunities: [
        { title: 'Automation', description: 'workflow' },
        { title: 'API sync', description: 'integration' },
        { title: 'Streamline ops', description: 'automate everything' },
      ],
    });

    assert.ok(result.icpFit <= 30, `icpFit should be <= 30, got ${result.icpFit}`);
    assert.ok(result.digitalGap <= 25, `digitalGap should be <= 25, got ${result.digitalGap}`);
    assert.ok(result.automationPotential <= 25, `automationPotential should be <= 25, got ${result.automationPotential}`);
    assert.ok(result.buyingSignals <= 20, `buyingSignals should be <= 20, got ${result.buyingSignals}`);
  });

  it('classifies HOT for high total', () => {
    const result = computeLeadScore({
      icp: {},
      research: {
        industryMatch: 'high',
        sizeMatch: true,
        techStackOverlap: 0.9,
        digitalMaturity: 'low',
        recentFunding: true,
        hiringGrowth: 'increasing',
        hasBlog: true,
        blogRecency: 'recent',
        socialPresence: 'active',
      },
      opportunities: [
        { title: 'Automation', description: 'workflow sync' },
        { title: 'API integration', description: 'streamline data' },
        { title: 'Auto sync', description: 'automate pipeline' },
      ],
    });
    assert.equal(result.classification, 'HOT');
  });

  it('classifies COLD for low total', () => {
    const result = computeLeadScore({
      icp: {},
      research: {
        industryMatch: 'low',
        sizeMatch: false,
        digitalMaturity: 'high',
      },
      opportunities: [],
    });
    assert.equal(result.classification, 'COLD');
  });

  it('handles missing data gracefully', () => {
    const result = computeLeadScore({
      icp: null,
      research: null,
      opportunities: null,
    });
    assert.ok(result.total >= 0);
    assert.ok(['HOT', 'WARM', 'COLD'].includes(result.classification));
  });
});
