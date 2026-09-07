import { z } from 'zod';

const str = z.string();
const nullableStr = z.union([z.string(), z.null()]).transform((v) => (v === null ? null : v.trim() || null));

export const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
export const CLASSIFICATIONS = ['HOT', 'WARM', 'COLD'];
export const LEAD_STATUSES = ['NEW', 'RESEARCHED', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'WON', 'LOST'];

/* ---------- Agent 1: ICP Analyst output ---------- */
export const IcpProfileSchema = z.object({
  target_industry: nullableStr,
  business_size: nullableStr,
  target_locations: z.array(str).default([]),
  services_offered: z.array(str).default([]),
  ideal_customer_signals: z.array(str).default([]),
  disqualifiers: z.array(str).default([]),
  buying_triggers: z.array(str).default([]),
  decision_maker_titles: z.array(str).default([]),
  budget_range: nullableStr,
  summary: str.min(1),
  missing_information: z.array(str).default([]),
});

/* ---------- Agent 3: Business Research output ---------- */
export const BusinessResearchSchema = z.object({
  business_overview: str.min(1),
  observed_facts: z
    .array(
      z.object({
        fact: str.min(1),
        source: str.min(1),
      }),
    )
    .default([]),
  ai_inferences: z
    .array(
      z.object({
        inference: str.min(1),
        confidence: z.enum(['high', 'medium', 'low']),
        based_on: str.min(1),
      }),
    )
    .default([]),
  likely_services_needed: z.array(str).default([]),
  digital_presence_summary: str.min(1),
  estimated_tech_maturity: z.enum(['low', 'medium', 'high', 'unknown']),
  unknowns: z.array(str).default([]),
});

/* ---------- Agent 4: Website Intelligence AI layer ---------- */
export const WebsiteInsightSchema = z.object({
  overall_assessment: str.min(1),
  conversion_readiness: z.enum(['poor', 'basic', 'good', 'strong', 'unknown']),
  notable_strengths: z.array(str).default([]),
  notable_weaknesses: z.array(str).default([]),
  automation_gaps: z.array(str).default([]),
});

/* ---------- Agent 5: Opportunity Detection ---------- */
export const OpportunitySchema = z.object({
  title: str.min(1),
  problem: str.min(1),
  evidence: str.min(1),
  solution: str.min(1),
  business_impact: str.min(1),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  category: str.min(1).default('General'),
  recommended_service: nullableStr,
});

export const OpportunityListSchema = z.object({
  opportunities: z.array(OpportunitySchema).default([]),
  no_opportunity_reason: nullableStr.optional().default(null),
});

/* ---------- Agent 6: Score explanation (numbers are computed in code) ---------- */
export const ScoreExplanationSchema = z.object({
  reason: str.min(1),
  icp_fit_reason: str.min(1),
  digital_gap_reason: str.min(1),
  automation_potential_reason: str.min(1),
  buying_signals_reason: str.min(1),
});

/* ---------- Sales Strategy ---------- */
export const SalesStrategySchema = z.object({
  recommended_service: str.min(1),
  why_this_lead: str.min(1),
  opening_angle: str.min(1),
  pain_point_to_lead_with: str.min(1),
  suggested_demo: str.min(1),
  next_step: str.min(1),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

/* ---------- Agent 7: Outreach ---------- */
export const OutreachSchema = z.object({
  email: z.object({
    subject: str.min(1),
    body: str.min(1),
  }),
  linkedin: z.object({
    message: str.min(1),
  }),
  whatsapp: z.object({
    message: str.min(1),
  }),
  referenced_findings: z.array(str).default([]),
});

/* ---------- HTTP request validation ---------- */
export const IcpAnalyzeRequest = z.object({
  description: str.max(4000).optional().default(''),
  structured: z
    .object({
      industry: str.max(200).optional().default(''),
      location: str.max(200).optional().default(''),
      business_size: str.max(200).optional().default(''),
      services_offered: str.max(1000).optional().default(''),
      budget_range: str.max(200).optional().default(''),
    })
    .optional()
    .default({}),
  scenario_id: str.max(80).optional(),
});

export const DiscoverRequest = z.object({
  icp: z.record(z.any()).optional(),
  industry: str.max(200).optional().default(''),
  location: str.max(200).optional().default(''),
  limit: z.coerce.number().int().min(1).max(25).optional().default(10),
  provider: z.enum(['demo_dataset', 'auto']).optional().default('auto'),
});

export const ResearchRequest = z.object({
  business_id: str.max(120).optional(),
  business: z.record(z.any()).optional(),
  icp: z.record(z.any()).optional(),
  force: z.boolean().optional().default(false),
});

export const AnalyzeRequest = z.object({
  lead_id: str.max(120),
  force: z.boolean().optional().default(false),
});

export const OutreachRequest = z.object({
  lead_id: str.max(120),
  channel: z.enum(['all', 'email', 'linkedin', 'whatsapp']).optional().default('all'),
  tone: z.enum(['consultative', 'direct', 'friendly']).optional().default('consultative'),
  force: z.boolean().optional().default(false),
});

export const StatusRequest = z.object({
  status: z.enum(LEAD_STATUSES),
  note: str.max(1000).optional(),
});
