import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { store } from './lib/store.js';
import { errorHandler, notFoundHandler } from './lib/errors.js';
import { rateLimit } from './lib/rateLimit.js';

import icpRoutes from './routes/icp.js';
import discoverRoutes from './routes/discover.js';
import researchRoutes from './routes/research.js';
import outreachRoutes from './routes/outreach.js';
import leadsRoutes from './routes/leads.js';
import settingsRoutes from './routes/settings.js';
import businessesRoutes from './routes/businesses.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit();

await store.init();

app.use('/api', apiLimiter);

app.use('/api/icp', icpRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/businesses', businessesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

const port = config.port;
app.listen(port, () => {
  console.log(`FirmScout AI server running on http://localhost:${port}`);
});

export default app;
