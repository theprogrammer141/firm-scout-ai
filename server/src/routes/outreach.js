import { Router } from 'express';
import { store, makeId } from '../lib/store.js';
import { generateOutreach } from '../agents/outreach.js';
import { badRequest, notFound } from '../lib/errors.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { leadId, tone } = req.body || {};
    if (!leadId) return next(badRequest('leadId is required'));

    const lead = await store.findById('leads', 'id', leadId);
    if (!lead) return next(notFound('Lead not found'));

    const allResearch = await store.readAll('research');
    const research = allResearch.find(r => r.leadId === leadId) || null;
    const allOpps = await store.readAll('opportunities');
    const opportunities = allOpps.filter(o => o.leadId === leadId);

    const outreach = await generateOutreach({
      lead,
      research,
      opportunities,
      strategy: lead.strategy,
      tone: tone || 'professional-friendly'
    });

    const record = {
      id: makeId('outreach'),
      leadId,
      businessId: lead.businessId,
      ...outreach,
      createdAt: new Date().toISOString()
    };
    await store.insert('outreach', record);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

export default router;
