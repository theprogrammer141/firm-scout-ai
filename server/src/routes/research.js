import { Router } from 'express';
import { store } from '../lib/store.js';
import { runAnalyzePipeline, getJob } from '../pipeline/job-manager.js';
import { badRequest, notFound } from '../lib/errors.js';

const router = Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { businessId, icpDescription, icpStructured } = req.body || {};
    if (!businessId) return next(badRequest('businessId is required'));
    if (!icpDescription || icpDescription.trim().length < 10) {
      return next(badRequest('ICP description must be at least 10 characters'));
    }
    const business = await store.findById('businesses', 'business_id', businessId);
    if (!business) return next(notFound('Business not found'));

    const job = await runAnalyzePipeline({ businessId, icpDescription, icpStructured });
    res.json({ success: true, jobId: job.id, stage: job.stage });
  } catch (err) {
    next(err);
  }
});

router.get('/job/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  res.json({ success: true, data: job });
});

export default router;
