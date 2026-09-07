import { Router } from 'express';
import { store } from '../lib/store.js';
import { notFound } from '../lib/errors.js';

const router = Router();

router.get('/', async (req, res) => {
  const leads = await store.readAll('leads');
  const { status, classification, sort } = req.query;
  let filtered = leads;
  if (status) filtered = filtered.filter(l => l.status === status);
  if (classification) filtered = filtered.filter(l => l.score?.classification === classification);
  if (sort === 'score') filtered.sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
  else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: filtered, total: filtered.length });
});

router.get('/:id', async (req, res) => {
  const lead = await store.findById('leads', 'id', req.params.id);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
  res.json({ success: true, data: lead });
});

router.patch('/:id', async (req, res) => {
  const lead = await store.findById('leads', 'id', req.params.id);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
  const { status, notes, tags } = req.body || {};
  const patch = {};
  if (status) patch.status = status;
  if (notes !== undefined) patch.notes = notes;
  if (tags) patch.tags = tags;
  const updated = await store.update('leads', 'id', req.params.id, patch);
  res.json({ success: true, data: updated });
});

router.delete('/:id', async (req, res) => {
  const removed = await store.remove('leads', 'id', req.params.id);
  if (!removed) return res.status(404).json({ success: false, error: 'Lead not found' });
  res.json({ success: true, deleted: true });
});

router.get('/:id/research', async (req, res) => {
  const allResearch = await store.readAll('research');
  const research = allResearch.filter(r => r.leadId === req.params.id);
  res.json({ success: true, data: research });
});

router.get('/:id/opportunities', async (req, res) => {
  const allOpps = await store.readAll('opportunities');
  const opps = allOpps.filter(o => o.leadId === req.params.id);
  res.json({ success: true, data: opps });
});

router.get('/:id/outreach', async (req, res) => {
  const allOutreach = await store.readAll('outreach');
  const outreach = allOutreach.filter(o => o.leadId === req.params.id);
  res.json({ success: true, data: outreach });
});

export default router;
