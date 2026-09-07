import { Router } from 'express';
import { config, aiEnabled } from '../config.js';
import { probeDashScope, getAiTelemetry } from '../lib/dashscope.js';

const router = Router();

router.get('/ai-status', async (req, res) => {
  const enabled = aiEnabled();
  const telemetry = getAiTelemetry();
  res.json({
    success: true,
    data: {
      enabled,
      model: config.dashscope.models.reasoning,
      baseUrl: config.dashscope.baseUrl,
      telemetry
    }
  });
});

router.post('/probe', async (req, res) => {
  try {
    const result = await probeDashScope();
    res.json({ success: true, data: result });
  } catch (err) {
    res.json({ success: false, error: err.message, data: { reachable: false } });
  }
});

router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      port: config.port,
      aiEnabled: aiEnabled(),
      model: config.dashscope.models.reasoning,
      cacheTtlHours: Math.round(config.researchCacheTtlMs / (60 * 60 * 1000)),
      rateLimit: config.rateLimit
    }
  });
});

export default router;
