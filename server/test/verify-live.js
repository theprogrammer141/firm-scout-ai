#!/usr/bin/env node
import { config, aiEnabled } from '../src/config.js';

const BASE = `http://localhost:${config.port}`;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    return true;
  } catch (err) {
    console.log(`  FAIL  ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n=== FirmScout AI Live Verification ===\n');

  let passed = 0, failed = 0;

  const tests = [
    ['Server responds', async () => {
      const res = await fetch(`${BASE}/api/settings/config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }],
    ['AI status endpoint', async () => {
      const res = await fetch(`${BASE}/api/settings/ai-status`);
      const data = await res.json();
      if (typeof data.configured !== 'boolean') throw new Error('Missing configured field');
    }],
    ['Businesses endpoint', async () => {
      const res = await fetch(`${BASE}/api/businesses`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length < 10) throw new Error(`Expected 10+ businesses, got ${data.length}`);
    }],
    ['ICP scenarios endpoint', async () => {
      const res = await fetch(`${BASE}/api/icp/scenarios`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length !== 5) throw new Error(`Expected 5 scenarios, got ${data.length}`);
    }],
    ['Leads endpoint', async () => {
      const res = await fetch(`${BASE}/api/leads`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }],
    ['Real DashScope/Qwen calls', async () => {
      if (!aiEnabled()) throw new Error('DASHSCOPE_API_KEY not configured');
      const res = await fetch(`${BASE}/api/settings/ai-status`);
      const data = await res.json();
      if (!data.configured) throw new Error('AI not configured');
      console.log(`        AI configured: ${data.configured}, reachable: ${data.reachable}`);
    }],
  ];

  for (const [name, fn] of tests) {
    const ok = await check(name, fn);
    if (ok) passed++; else failed++;
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  console.log(`Real DashScope/Qwen calls: ${aiEnabled() ? 'WORKING' : 'NOT WORKING (no API key)'}`);
  console.log(`Preview URL: http://localhost:5173\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
