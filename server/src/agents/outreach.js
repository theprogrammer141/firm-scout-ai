import { chatJson, AiUnavailableError } from '../lib/dashscope.js';
import { sanitizeUserText, evidenceBlock } from '../lib/sanitize.js';
import { OutreachSchema } from '../lib/schemas.js';
import { aiEnabled } from '../config.js';

function fallbackOutreach({ lead, opportunities }) {
  const oppNames = (opportunities || []).slice(0, 2).map(o => o.title).join(' and ');
  return {
    emailSubject: `Quick idea for ${lead?.name || 'your team'}`,
    emailBody: `Hi ${lead?.contactName || 'there'},\n\nI noticed ${lead?.name || 'your company'} might benefit from ${oppNames || 'some process improvements'}. We help companies like yours streamline operations and reduce manual work.\n\nWould you be open to a quick 15-minute chat?\n\nBest regards`,
    linkedInOpener: `Hi ${lead?.contactName || 'there'} — came across ${lead?.name || 'your company'} and noticed some interesting parallels with other ${lead?.industry || ''} companies we work with.`,
    callTalkingPoints: [
      `Research ${lead?.name || 'the company'} pain points`,
      `Discuss ${oppNames || 'potential improvements'}`,
      `Explore fit and next steps`
    ],
    valueProposition: `We help ${lead?.industry || 'businesses'} like ${lead?.name || 'yours'} automate workflows and close more deals.`,
    followUpCadence: [
      { day: 0, action: 'Send initial email' },
      { day: 3, action: 'LinkedIn connection request' },
      { day: 5, action: 'Follow-up email with case study' },
      { day: 8, action: 'Phone call attempt' },
      { day: 12, action: 'Final follow-up email' }
    ]
  };
}

export async function generateOutreach({ lead, research, opportunities, strategy, tone }) {
  const fallback = fallbackOutreach({ lead, opportunities });
  if (!aiEnabled()) return { ...fallback, aiGenerated: false };

  try {
    const context = evidenceBlock(JSON.stringify({
      lead: { name: lead?.name, industry: lead?.industry, size: lead?.size },
      topOpportunities: (opportunities || []).slice(0, 3).map(o => ({ title: o.title, description: o.description })),
      strategy: strategy?.approach,
      tone: tone || 'professional-friendly'
    }, null, 2), 'outreach context');

    const { data } = await chatJson({
      system: 'You are a sales outreach specialist. Generate personalized outreach content for a sales lead. All content must be based ONLY on the provided evidence — never fabricate claims about the company.',
      user: `Generate personalized outreach for this lead:\n${context}\n\nTone: ${tone || 'professional-friendly'}`,
      schema: OutreachSchema,
      maxTokens: 1500
    });
    return { ...data, aiGenerated: true };
  } catch (err) {
    if (err instanceof AiUnavailableError) return { ...fallback, aiGenerated: false };
    return { ...fallback, aiGenerated: false, warning: 'AI generation failed, using template.' };
  }
}
