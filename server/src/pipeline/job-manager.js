import { store, makeId } from '../lib/store.js';
import { analyzeIcp, fallbackIcp } from '../agents/icp-analyst.js';
import { researchBusiness } from '../agents/business-research.js';
import { analyzeWebsiteIntelligence } from '../agents/website-intelligence.js';
import { detectOpportunities } from '../agents/opportunity-detection.js';
import { computeLeadScore, explainLeadScore } from '../agents/lead-scoring.js';
import { generateSalesStrategy } from '../agents/sales-strategy.js';
import { generateOutreach } from '../agents/outreach.js';
import { fetchWebsite, analyzeHtml } from '../lib/website.js';

const jobs = new Map();

const STAGES = [
  'icp',
  'discovery',
  'research',
  'website_intel',
  'opportunities',
  'scoring',
  'strategy',
  'outreach',
  'complete'
];

function createJob(type, params) {
  const id = makeId('job');
  const job = {
    id,
    type,
    status: 'running',
    stage: 'icp',
    stageIndex: 0,
    stages: STAGES,
    progress: 0,
    params,
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  jobs.set(id, job);
  return job;
}

function advanceJob(job, stage) {
  job.stage = stage;
  job.stageIndex = STAGES.indexOf(stage);
  job.progress = Math.round((job.stageIndex / (STAGES.length - 1)) * 100);
  job.updatedAt = new Date().toISOString();
}

export async function runAnalyzePipeline({ businessId, icpDescription, icpStructured }) {
  const job = createJob('analyze', { businessId, icpDescription });
  
  setImmediate(() => executeAnalyzePipeline(job, { businessId, icpDescription, icpStructured }));
  return job;
}

export async function runDiscoverPipeline({ icpDescription, icpStructured, filters }) {
  const job = createJob('discover', { icpDescription, filters });
  
  setImmediate(() => executeDiscoverPipeline(job, { icpDescription, icpStructured, filters }));
  return job;
}

async function executeAnalyzePipeline(job, { businessId, icpDescription, icpStructured }) {
  try {
    // Stage 1: ICP Analysis
    advanceJob(job, 'icp');
    let icp;
    try {
      icp = await analyzeIcp({ description: icpDescription, structured: icpStructured });
    } catch {
      icp = fallbackIcp(icpDescription);
    }
    job.result = { icp };

    // Get business
    const business = await store.findById('businesses', 'business_id', businessId);
    if (!business) throw new Error(`Business ${businessId} not found`);

    // Stage 2: Discovery (already have the business)
    advanceJob(job, 'discovery');
    await sleep(100); // Brief pause for UI

    // Stage 3: Research
    advanceJob(job, 'research');
    const research = await researchBusiness({ business, icp });
    job.result.research = research;

    // Stage 4: Website Intelligence
    advanceJob(job, 'website_intel');
    const { html } = await fetchWebsite(business);
    const htmlAnalysis = html ? analyzeHtml(html, { url: business.website }) : null;
    const websiteInsight = await analyzeWebsiteIntelligence({ business, research, htmlAnalysis });
    job.result.websiteInsight = websiteInsight;

    // Stage 5: Opportunity Detection
    advanceJob(job, 'opportunities');
    const opportunities = await detectOpportunities({ business, icp, research, websiteInsight });
    job.result.opportunities = opportunities;

    // Stage 6: Lead Scoring (deterministic)
    advanceJob(job, 'scoring');
    const score = computeLeadScore({ icp, research, opportunities });
    const scoreExplanation = await explainLeadScore({ lead: business, score, research, opportunities });
    job.result.score = { ...score, explanation: scoreExplanation };

    // Stage 7: Sales Strategy
    advanceJob(job, 'strategy');
    const strategy = await generateSalesStrategy({ lead: business, research, opportunities });
    job.result.strategy = strategy;

    // Stage 8: Outreach
    advanceJob(job, 'outreach');
    const outreach = await generateOutreach({ lead: business, research, opportunities, strategy });
    job.result.outreach = outreach;

    // Save lead to store
    const lead = {
      id: businessId,
      businessId,
      name: business.name,
      industry: business.industry,
      website: business.website,
      size: business.size,
      ...job.result,
      score: job.result.score,
      status: 'analyzed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await store.upsert('leads', 'id', lead);

    await store.insert('research', {
      id: makeId('research'),
      businessId,
      leadId: businessId,
      ...research,
      createdAt: new Date().toISOString()
    });

    for (const opp of opportunities) {
      await store.insert('opportunities', {
        id: makeId('opp'),
        businessId,
        leadId: businessId,
        ...opp,
        createdAt: new Date().toISOString()
      });
    }

    await store.insert('outreach', {
      id: makeId('outreach'),
      businessId,
      leadId: businessId,
      ...outreach,
      createdAt: new Date().toISOString()
    });

    // Complete
    advanceJob(job, 'complete');
    job.status = 'completed';
    job.progress = 100;
    job.updatedAt = new Date().toISOString();
  } catch (err) {
    job.status = 'failed';
    job.error = err.message || 'Pipeline failed';
    job.updatedAt = new Date().toISOString();
  }
}

async function executeDiscoverPipeline(job, { icpDescription, icpStructured, filters }) {
  try {
    // Stage 1: ICP Analysis
    advanceJob(job, 'icp');
    let icp;
    try {
      icp = await analyzeIcp({ description: icpDescription, structured: icpStructured });
    } catch {
      icp = fallbackIcp(icpDescription);
    }
    job.result = { icp };

    // Stage 2: Discovery — find matching businesses
    advanceJob(job, 'discovery');
    let businesses = await store.readAll('businesses');
    
    // Apply filters
    if (filters?.industry) {
      businesses = businesses.filter(b => b.industry.toLowerCase() === filters.industry.toLowerCase());
    }
    if (filters?.size) {
      businesses = businesses.filter(b => b.size === filters.size);
    }
    if (filters?.minScore) {
      // Will be applied after scoring
    }

    job.result.discoveredBusinesses = businesses.map(b => ({
      id: b.business_id,
      name: b.name,
      industry: b.industry,
      size: b.size,
      website: b.website,
      description: b.description
    }));

    // For each discovered business, run a lighter analysis
    const leads = [];
    for (let i = 0; i < Math.min(businesses.length, 10); i++) {
      const business = businesses[i];
      
      advanceJob(job, 'research');
      const research = await researchBusiness({ business, icp });
      
      advanceJob(job, 'scoring');
      const score = computeLeadScore({ icp, research, opportunities: [] });
      
      leads.push({
        id: business.business_id,
        businessId: business.business_id,
        name: business.name,
        industry: business.industry,
        size: business.size,
        website: business.website,
        score,
        research: { digitalMaturity: research.digitalMaturity, industryMatch: research.industryMatch },
        status: 'discovered'
      });
    }

    job.result.leads = leads;
    advanceJob(job, 'complete');
    job.status = 'completed';
    job.progress = 100;
    job.updatedAt = new Date().toISOString();
  } catch (err) {
    job.status = 'failed';
    job.error = err.message || 'Discovery pipeline failed';
    job.updatedAt = new Date().toISOString();
  }
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

export function listJobs() {
  return Array.from(jobs.values()).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
