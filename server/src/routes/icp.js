import { Router } from 'express';
import { analyzeIcp, fallbackIcp } from '../agents/icp-analyst.js';
import { DEMO_SCENARIOS } from '../seed/businesses.js';
import { badRequest } from '../lib/errors.js';
import { sanitizeUserText } from '../lib/sanitize.js';

const router = Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const { description, structured } = req.body || {};
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return next(badRequest('ICP description must be at least 10 characters'));
    }
    const clean = sanitizeUserText(description.trim());
    const profile = await analyzeIcp({ description: clean, structured });
    res.json({ success: true, data: profile });
  } catch (err) {
    if (err?.code === 'AI_UNAVAILABLE') {
      const fallback = fallbackIcp(req.body?.description);
      return res.json({ success: true, data: fallback, warning: 'AI unavailable, using fallback ICP' });
    }
    next(err);
  }
});

router.get('/scenarios', (req, res) => {
  res.json({ success: true, data: DEMO_SCENARIOS });
});

export default router;
