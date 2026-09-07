import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_BUSINESSES } from '../seed/businesses.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', '..', 'data');

const FILES = {
  businesses: 'businesses-db.json',
  leads: 'leads-db.json',
  research: 'research-db.json',
  opportunities: 'opportunities-db.json',
  outreach: 'outreach-db.json',
};

async function writeJson(filePath, data) {
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}

async function seed() {
  await fs.mkdir(dataDir, { recursive: true });

  const bizPath = path.join(dataDir, FILES.businesses);
  console.log(`Writing ${DEMO_BUSINESSES.length} businesses to ${bizPath}`);
  await writeJson(bizPath, DEMO_BUSINESSES);

  const written = await fs.readFile(bizPath, 'utf8');
  const parsed = JSON.parse(written);
  console.log(`Verified: ${parsed.length} businesses in file (${written.length} bytes)`);

  for (const [key, filename] of Object.entries(FILES)) {
    if (key === 'businesses') continue;
    const fp = path.join(dataDir, filename);
    try {
      await fs.access(fp);
    } catch {
      await writeJson(fp, []);
      console.log(`Created empty ${filename}`);
    }
  }

  console.log('Seed complete.');
}

seed().then(() => process.exit(0)).catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
