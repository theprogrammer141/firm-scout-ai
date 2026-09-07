import { chatJson, AiUnavailableError } from '../lib/dashscope.js';
import { evidenceBlock } from '../lib/sanitize.js';
import { SalesStrategySchema } from '../lib/schemas.js';
import { aiEnabled } from '../config.js';

function fallbackStrategy({ lead, opportunities }) {
  return {
    approach: 'Consultative selling focused on identified pain points',
    channels: ['email', 'linkedin'],
    timing: 'Reach out within 48 hours while signals are fresh',
    keyDifferentiators: ['Personalized research-backed approach', 'Focus on specific identified opportunities'],
    objections: [
      { objection: 'Not a priority right now', response: 'Reference specific pain point from research' },
      { objection: 'Already have a solution', response: 'Highlight gaps identified in website analysis' },
      { objection: 'Budget constraints', response: 'Emphasize ROI from automation potential' }
    ],
    nextSteps: [
      'Send personalized outreach email',
      'Connect on LinkedIn with personalized message',
      'Schedule discovery call within 5 business days'
    ]
  };
}

export async function generateSalesStrategy({ lead, research, opportunities }) {
  const fallback = fallbackStrategy({ lead, opportunities });
  if (!aiEnabled()) return { ...fallback, aiGenerated: false };

  try {
    const context = evidenceBlock(JSON.stringify({
      lead: { name: lead?.name, industry: lead?.industry, size: lead?.size },
      digitalMaturity: research?.digitalMaturity,
      topOpportunities: (opportunities || []).slice(0, 3).map(o => ({ title: o.title, impact: o.impact })),
      strengths: research?.strengths?.slice(0, 3),
      weaknesses: research?.weaknesses?.slice(0, 3)
    }, null, 2), 'strategy context');

    const { data } = await chatJson({
      system: 'You are a senior sales strategist. Given research about a prospect, create a concise sales strategy. Base everything on the provided evidence only.',
      user: `Create a sales strategy for engaging ${lead?.name || 'this prospect'}:\n${context}`,
      schema: SalesStrategySchema,
      maxTokens: 1200
    });
    return { ...data, aiGenerated: true };
  } catch (err) {
    if (err instanceof AiUnavailableError) return { ...fallback, aiGenerated: false };
    return { ...fallback, aiGenerated: false };
  }
}
