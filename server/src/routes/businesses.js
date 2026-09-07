import { Router } from 'express';
import { store } from '../lib/store.js';

const router = Router();

router.get('/', async (req, res) => {
  const businesses = await store.readAll('businesses');
  const { industry, size } = req.query;
  let filtered = businesses;
  if (industry) filtered = filtered.filter(b => b.industry.toLowerCase() === industry.toLowerCase());
  if (size) filtered = filtered.filter(b => b.size === size);
  res.json({ success: true, data: filtered, total: filtered.length });
});

router.get('/:id', async (req, res) => {
  const business = await store.findById('businesses', 'business_id', req.params.id);
  if (!business) return res.status(404).json({ success: false, error: 'Business not found' });
  res.json({ success: true, data: business });
});

export default router;
