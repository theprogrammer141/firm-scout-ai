import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serverRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(serverRoot, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

function int(value, fallback) {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: int(process.env.PORT, 5050),
  nodeEnv: process.env.NODE_ENV || 'development',

  dashscope: {
    apiKey: (process.env.DASHSCOPE_API_KEY || '').trim(),
    baseUrl: (process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1').replace(/\/$/, ''),
    models: {
      reasoning: process.env.QWEN_MODEL_REASONING || 'qwen-plus',
      fast: process.env.QWEN_MODEL_FAST || 'qwen-turbo',
      vision: process.env.QWEN_MODEL_VISION || 'qwen-vl-plus',
    },
    timeoutMs: int(process.env.DASHSCOPE_TIMEOUT_MS, 60000),
  },

  paths: {
    projectRoot,
    serverRoot,
    data: path.join(serverRoot, 'data'),
    snapshots: path.join(serverRoot, 'src', 'seed', 'snapshots'),
  },

  researchCacheTtlMs: int(process.env.RESEARCH_CACHE_TTL_HOURS, 24) * 60 * 60 * 1000,
  websiteTextLimit: int(process.env.WEBSITE_TEXT_LIMIT, 6000),
  websiteFetchTimeoutMs: int(process.env.WEBSITE_FETCH_TIMEOUT_MS, 12000),

  rateLimit: {
    windowMs: int(process.env.AI_RATE_LIMIT_WINDOW_MS, 60000),
    max: int(process.env.AI_RATE_LIMIT_MAX, 30),
  },

  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '256kb',
};

export const aiEnabled = () => config.dashscope.apiKey.length > 0;
