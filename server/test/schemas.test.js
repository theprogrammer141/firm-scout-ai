import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  IcpProfileSchema, BusinessResearchSchema, WebsiteInsightSchema,
  OpportunitySchema, OpportunityListSchema, ScoreExplanationSchema,
  SalesStrategySchema, OutreachSchema,
  IcpAnalyzeRequest, DiscoverRequest, ResearchRequest, AnalyzeRequest,
  OutreachRequest, StatusRequest,
} from '../src/lib/schemas.js';

describe('IcpProfileSchema', () => {
  it('accepts valid ICP', () => {
    const result = IcpProfileSchema.safeParse({
      target_industry: 'Dental',
      business_size: 'Small',
      target_locations: ['Lahore'],
      services_offered: ['Web Design'],
      ideal_customer_signals: ['no website'],
      disqualifiers: [],
      buying_triggers: ['expanding'],
      decision_maker_titles: ['Owner'],
      budget_range: '$500-2000',
      summary: 'Small dental clinics in Lahore',
      missing_information: [],
    });
    assert.ok(result.success);
  });

  it('requires summary', () => {
    const result = IcpProfileSchema.safeParse({ summary: '' });
    assert.ok(!result.success);
  });
});

describe('BusinessResearchSchema', () => {
  it('accepts valid research', () => {
    const result = BusinessResearchSchema.safeParse({
      business_overview: 'A dental clinic',
      observed_facts: [{ fact: 'Has website', source: 'web' }],
      ai_inferences: [{ inference: 'Needs SEO', confidence: 'high', based_on: 'No meta tags' }],
      likely_services_needed: ['SEO'],
      digital_presence_summary: 'Basic website',
      estimated_tech_maturity: 'low',
      unknowns: ['Budget'],
    });
    assert.ok(result.success);
  });

  it('rejects invalid tech maturity', () => {
    const result = BusinessResearchSchema.safeParse({
      business_overview: 'Test',
      digital_presence_summary: 'Test',
      estimated_tech_maturity: 'invalid',
    });
    assert.ok(!result.success);
  });
});

describe('OpportunityListSchema', () => {
  it('accepts opportunities list', () => {
    const result = OpportunityListSchema.safeParse({
      opportunities: [{
        title: 'SEO Improvement',
        problem: 'Low search visibility',
        evidence: 'No meta descriptions found',
        solution: 'Implement comprehensive SEO',
        business_impact: 'More organic traffic',
        priority: 'HIGH',
        category: 'SEO',
        recommended_service: 'SEO Package',
      }],
    });
    assert.ok(result.success);
  });

  it('accepts no-opportunity reason', () => {
    const result = OpportunityListSchema.safeParse({
      opportunities: [],
      no_opportunity_reason: 'Business already has strong digital presence',
    });
    assert.ok(result.success);
  });
});

describe('HTTP Request Schemas', () => {
  it('IcpAnalyzeRequest accepts valid input', () => {
    const result = IcpAnalyzeRequest.safeParse({ description: 'We are a dental supply company' });
    assert.ok(result.success);
  });

  it('DiscoverRequest coerces limit to int', () => {
    const result = DiscoverRequest.safeParse({ limit: '5' });
    assert.ok(result.success);
    assert.equal(result.data.limit, 5);
  });

  it('DiscoverRequest rejects limit > 25', () => {
    const result = DiscoverRequest.safeParse({ limit: 30 });
    assert.ok(!result.success);
  });

  it('AnalyzeRequest requires lead_id', () => {
    const result = AnalyzeRequest.safeParse({});
    assert.ok(!result.success);
  });

  it('StatusRequest requires valid status', () => {
    const result = StatusRequest.safeParse({ status: 'INVALID' });
    assert.ok(!result.success);
  });

  it('StatusRequest accepts valid status', () => {
    const result = StatusRequest.safeParse({ status: 'CONTACTED' });
    assert.ok(result.success);
  });
});

describe('OutreachSchema', () => {
  it('accepts valid outreach', () => {
    const result = OutreachSchema.safeParse({
      email: { subject: 'Hello', body: 'Hi there' },
      linkedin: { message: 'Connect with me' },
      whatsapp: { message: 'Quick question' },
      referenced_findings: ['No chatbot on site'],
    });
    assert.ok(result.success);
  });
});
