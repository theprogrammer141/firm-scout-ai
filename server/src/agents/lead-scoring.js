import { chatText, AiUnavailableError } from '../lib/dashscope.js';
import { evidenceBlock } from '../lib/sanitize.js';
import { aiEnabled } from '../config.js';

export function computeLeadScore({ icp, research, opportunities }) {
  // icpFit: 0-30 based on industry match, size match, tech stack overlap
  let icpFit = 0;
  if (research?.industryMatch === 'high') icpFit += 15;
  else if (research?.industryMatch === 'medium') icpFit += 8;
  else if (research?.industryMatch === 'low') icpFit += 2;
  if (research?.sizeMatch === true) icpFit += 10;
  else if (research?.sizeMatch === 'close') icpFit += 5;
  if (research?.techStackOverlap && research.techStackOverlap > 0.5) icpFit += 5;
  else if (research?.techStackOverlap && research.techStackOverlap > 0.2) icpFit += 3;
  icpFit = Math.min(30, icpFit);

  // digitalGap: 0-25 — bigger gap = higher score (more opportunity to sell)
  let digitalGap = 0;
  const maturity = research?.digitalMaturity; // 'low' | 'medium' | 'high'
  if (maturity === 'low') digitalGap = 25;
  else if (maturity === 'medium') digitalGap = 15;
  else if (maturity === 'high') digitalGap = 5;
  // Also factor in website sub-scores
  if (research?.websiteSubScores) {
    const avg = Object.values(research.websiteSubScores).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(research.websiteSubScores).length);
    if (avg < 0.3) digitalGap = Math.min(25, digitalGap + 5);
  }
  digitalGap = Math.min(25, digitalGap);

  // automationPotential: 0-25
  let automationPotential = 0;
  const opps = opportunities || [];
  if (opps.length >= 3) automationPotential = 25;
  else if (opps.length === 2) automationPotential = 18;
  else if (opps.length === 1) automationPotential = 10;
  // Boost if opportunities mention automation-related keywords
  const autoKeywords = ['automat', 'workflow', 'integration', 'api', 'sync', 'streamline'];
  const hasAutoKeywords = opps.some(o => 
    autoKeywords.some(k => (o.title + ' ' + (o.description || '')).toLowerCase().includes(k))
  );
  if (hasAutoKeywords) automationPotential = Math.min(25, automationPotential + 5);
  automationPotential = Math.min(25, automationPotential);

  // buyingSignals: 0-20
  let buyingSignals = 0;
  if (research?.recentFunding) buyingSignals += 8;
  if (research?.hiringGrowth === 'increasing') buyingSignals += 6;
  else if (research?.hiringGrowth === 'stable') buyingSignals += 3;
  if (research?.hasBlog && research?.blogRecency === 'recent') buyingSignals += 3;
  else if (research?.hasBlog) buyingSignals += 1;
  if (research?.socialPresence === 'active') buyingSignals += 3;
  else if (research?.socialPresence === 'moderate') buyingSignals += 1;
  buyingSignals = Math.min(20, buyingSignals);

  const total = icpFit + digitalGap + automationPotential + buyingSignals;
  let classification = 'COLD';
  if (total >= 70) classification = 'HOT';
  else if (total >= 45) classification = 'WARM';

  return {
    total,
    icpFit,
    digitalGap,
    automationPotential,
    buyingSignals,
    classification
  };
}

export async function explainLeadScore({ lead, score, research, opportunities }) {
  if (!aiEnabled()) {
    return 'AI disabled — scoring is rule-based. Enable DashScope API key for AI explanations.';
  }
  try {
    const evidence = evidenceBlock(JSON.stringify({
      icpFit: score.icpFit,
      digitalGap: score.digitalGap,
      automationPotential: score.automationPotential,
      buyingSignals: score.buyingSignals,
      total: score.total,
      classification: score.classification,
      opportunities: (opportunities || []).slice(0, 3).map(o => o.title),
      digitalMaturity: research?.digitalMaturity,
      industryMatch: research?.industryMatch
    }, null, 2), 'lead score data');

    const result = await chatText({
      system: 'You are a sales intelligence analyst. Given a lead score breakdown, write a concise 2-3 sentence explanation of why this lead scored the way it did and what the strongest signal is. Be specific.',
      user: `Lead: ${lead?.name || 'Unknown'}\n${evidence}\n\nExplain this score.`,
      maxTokens: 200
    });
    return result;
  } catch (err) {
    if (err instanceof AiUnavailableError) return 'AI unavailable — showing rule-based score only.';
    return 'Unable to generate AI explanation.';
  }
}
