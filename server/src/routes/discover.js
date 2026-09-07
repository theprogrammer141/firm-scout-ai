import { Router } from 'express';
import { store } from '../lib/store.js';
import { runDiscoverPipeline } from '../pipeline/job-manager.js';
import { badRequest } from '../lib/errors.js';
import { sanitizeUserText } from '../lib/sanitize.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { icpDescription, icpStructured, filters } = req.body || {};
    if (!icpDescription || typeof icpDescription !== 'string' || icpDescription.trim().length < 10) {
      return next(badRequest('ICP description must be at least 10 characters'));
    }
    const clean = sanitizeUserText(icpDescription.trim());
    const job = await runDiscoverPipeline({ icpDescription: clean, icpStructured, filters });
    res.json({ success: true, jobId: job.id, stage: job.stage });
  } catch (err) {
    next(err);
  }
});

router.get('/results', async (req, res) => {
  const leads = await store.readAll('leads');
  res.json({ success: true, data: leads, total: leads.length });
});

export default router;
