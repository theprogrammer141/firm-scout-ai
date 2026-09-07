import { chatJson } from '../lib/dashscope.js';
import { IcpProfileSchema } from '../lib/schemas.js';
import { sanitizeUserText } from '../lib/sanitize.js';
import { aiEnabled } from '../config.js';

export async function analyzeIcp({ description, structured }) {
  const desc = sanitizeUserText(description || '', 4000);
  const struct = structured || {};
  
  if (!aiEnabled()) {
    return fallbackIcp(desc, struct);
  }
  
  const system = `You are an ICP (Ideal Customer Profile) analyst. Given a description of a user's business, produce a structured ICP that defines their best target customers. Be specific and actionable. Output ONLY valid JSON matching the schema.`;
  
  const user = `Business description: ${desc || '(not provided)'}
Industry: ${struct.industry || 'not specified'}
Location: ${struct.location || 'not specified'}
Business size: ${struct.business_size || 'not specified'}
Services offered: ${struct.services_offered || 'not specified'}
Budget range: ${struct.budget_range || 'not specified'}

Produce the ICP JSON.`;

  const { data } = await chatJson({
    system, user,
    schema: IcpProfileSchema,
    label: 'icp-analyst',
  });
  return data;
}

export function fallbackIcp(desc, struct) {
  return {
    target_industry: struct.industry || null,
    business_size: struct.business_size || null,
    target_locations: struct.location ? [struct.location] : [],
    services_offered: struct.services_offered ? struct.services_offered.split(',').map(s => s.trim()).filter(Boolean) : [],
    ideal_customer_signals: [],
    disqualifiers: [],
    buying_triggers: [],
    decision_maker_titles: [],
    budget_range: struct.budget_range || null,
    summary: desc || 'ICP analysis requires a DashScope API key.',
    missing_information: ['AI analysis unavailable — using raw input only'],
  };
}
