import { chatJson } from '../lib/dashscope.js';
import { OpportunityListSchema } from '../lib/schemas.js';
import { evidenceBlock, sanitizeUserText } from '../lib/sanitize.js';
import { aiEnabled } from '../config.js';

export async function detectOpportunities({ business, icp, research, websiteInsight }) {
  if (!aiEnabled()) {
    return fallbackOpportunities(business, research, websiteInsight);
  }
  
  const researchBlock = evidenceBlock('BUSINESS RESEARCH', JSON.stringify(research, null, 2), 5000);
  const icpBlock = evidenceBlock('ICP PROFILE', JSON.stringify(icp), 3000);
  const insightBlock = websiteInsight ? evidenceBlock('WEBSITE INSIGHTS', JSON.stringify(websiteInsight, null, 2), 3000) : '';
  
  const system = `You are a sales opportunity detection specialist. Given business research, an ICP profile, and website insights, identify specific actionable opportunities where the user's services could help this business. Each opportunity must be backed by evidence from the research. If the business is a poor fit, explain why instead. Output ONLY valid JSON matching the schema.`;
  
  const user = `Target business: ${business?.name || 'Unknown'}

${icpBlock}

${researchBlock}

${insightBlock}

Identify opportunities or explain why this is not a good fit.`;

  const { data } = await chatJson({
    system, user,
    schema: OpportunityListSchema,
    label: 'opportunity-detection',
    maxTokens: 2400,
  });
  
  return data;
}

function fallbackOpportunities(business, research, websiteInsight) {
  const analysis = research?._website_analysis;
  if (!analysis) {
    return {
      opportunities: [],
      no_opportunity_reason: 'Insufficient data for opportunity detection (AI analysis unavailable).',
    };
  }
  
  const opps = [];
  if (analysis.scores.conversion < 50) {
    opps.push({
      title: 'Conversion Optimization',
      problem: 'Low conversion readiness score',
      evidence: `Conversion score: ${analysis.scores.conversion}/100`,
      solution: 'Redesign landing pages with clear CTAs and trust signals',
      business_impact: 'Could significantly increase lead conversion rates',
      priority: 'HIGH',
      category: 'Conversion',
      recommended_service: 'Landing Page Optimization',
    });
  }
  if (analysis.scores.automation < 50) {
    opps.push({
      title: 'Process Automation',
      problem: 'Limited automation detected',
      evidence: `Automation score: ${analysis.scores.automation}/100`,
      solution: 'Implement automated booking, follow-up, and notification systems',
      business_impact: 'Reduce manual work and improve response times',
      priority: 'MEDIUM',
      category: 'Automation',
      recommended_service: 'Business Process Automation',
    });
  }
  if (analysis.scores.presence < 50) {
    opps.push({
      title: 'Digital Presence Enhancement',
      problem: 'Weak online presence',
      evidence: `Presence score: ${analysis.scores.presence}/100`,
      solution: 'Build comprehensive web presence with SEO and content strategy',
      business_impact: 'Increase visibility and attract more potential customers',
      priority: 'MEDIUM',
      category: 'Digital Presence',
      recommended_service: 'Web Development & SEO',
    });
  }
  
  return {
    opportunities: opps,
    no_opportunity_reason: opps.length === 0 ? 'Business shows adequate digital maturity — no critical gaps detected.' : null,
  };
}
