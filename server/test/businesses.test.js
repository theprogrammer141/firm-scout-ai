import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_BUSINESSES, DEMO_SCENARIOS } from '../src/seed/businesses.js';

describe('DEMO_BUSINESSES', () => {
  it('has at least 15 businesses', () => {
    assert.ok(DEMO_BUSINESSES.length >= 15);
  });

  it('each business has required fields', () => {
    for (const biz of DEMO_BUSINESSES) {
      assert.ok(biz.business_id, `Business missing business_id`);
      assert.ok(biz.name, `Business ${biz.business_id} missing name`);
      assert.ok(biz.industry, `Business ${biz.business_id} missing industry`);
      assert.ok(biz.location, `Business ${biz.business_id} missing location`);
    }
  });

  it('has unique IDs', () => {
    const ids = new Set(DEMO_BUSINESSES.map(b => b.business_id));
    assert.equal(ids.size, DEMO_BUSINESSES.length);
  });

  it('covers multiple industries', () => {
    const industries = new Set(DEMO_BUSINESSES.map(b => b.industry));
    assert.ok(industries.size >= 4);
  });

  it('has varied maturity labels', () => {
    const labels = new Set(DEMO_BUSINESSES.map(b => b.maturity_label));
    assert.ok(labels.size >= 3);
  });
});

describe('DEMO_SCENARIOS', () => {
  it('has 5 scenarios', () => {
    assert.equal(DEMO_SCENARIOS.length, 5);
  });

  it('each scenario has required fields', () => {
    for (const s of DEMO_SCENARIOS) {
      assert.ok(s.scenario_id);
      assert.ok(s.label);
      assert.ok(s.description);
    }
  });
});
