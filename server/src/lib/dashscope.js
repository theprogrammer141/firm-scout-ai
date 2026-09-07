import { config, aiEnabled } from '../config.js';

/**
 * Server-side Alibaba Cloud DashScope (Qwen) client.
 * Uses the OpenAI-compatible Chat Completions endpoint.
 * The API key never leaves this module.
 */

export class AiUnavailableError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AiUnavailableError';
    this.code = 'AI_UNAVAILABLE';
    if (cause) this.cause = cause;
  }
}

export class AiInvalidJsonError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AiInvalidJsonError';
    this.code = 'AI_INVALID_JSON';
  }
}

const telemetry = {
  configured: false,
  last_check_at: null,
  reachable: null,
  last_error: null,
  calls_total: 0,
  calls_failed: 0,
  json_retries: 0,
  tokens_prompt: 0,
  tokens_completion: 0,
  by_model: {},
};

export function getAiTelemetry() {
  return {
    ...telemetry,
    configured: aiEnabled(),
    base_url: config.dashscope.baseUrl,
    models: { ...config.dashscope.models },
    by_model: { ...telemetry.by_model },
  };
}

function recordCall(model, usage) {
  telemetry.calls_total += 1;
  telemetry.by_model[model] = (telemetry.by_model[model] || 0) + 1;
  if (usage) {
    telemetry.tokens_prompt += usage.prompt_tokens || 0;
    telemetry.tokens_completion += usage.completion_tokens || 0;
  }
}

/** Removes markdown fences and locates the outermost JSON value. */
function extractJson(text) {
  if (typeof text !== 'string') return null;
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  const firstObj = s.indexOf('{');
  const firstArr = s.indexOf('[');
  let start = -1;
  let open = '{';
  let close = '}';
  if (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) {
    start = firstObj;
  } else if (firstArr !== -1) {
    start = firstArr;
    open = '[';
    close = ']';
  }
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i += 1) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        const candidate = s.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function rawChat({ model, messages, temperature = 0.3, maxTokens = 1600, jsonMode = false }) {
  if (!aiEnabled()) {
    throw new AiUnavailableError('DASHSCOPE_API_KEY is not configured.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.dashscope.timeoutMs);

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  let res;
  try {
    res = await fetch(`${config.dashscope.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.dashscope.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    telemetry.calls_failed += 1;
    telemetry.reachable = false;
    const isAbort = err?.name === 'AbortError';
    telemetry.last_error = isAbort ? 'Request to DashScope timed out.' : 'Could not reach DashScope.';
    throw new AiUnavailableError(telemetry.last_error, err);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    telemetry.calls_failed += 1;
    let detail = '';
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || errJson?.message || '';
    } catch {
      detail = '';
    }
    // Never surface the key or raw upstream payloads to callers.
    const safeDetail = String(detail).replace(/sk-[A-Za-z0-9]+/g, '[redacted]').slice(0, 300);
    const msg =
      res.status === 429
        ? 'DashScope rate limit or quota reached. Please retry in a moment.'
        : res.status === 401 || res.status === 403
          ? 'DashScope rejected the API key (unauthorized).'
          : `DashScope returned HTTP ${res.status}.`;
    telemetry.reachable = res.status !== 401 && res.status !== 403;
    telemetry.last_error = safeDetail ? `${msg} ${safeDetail}` : msg;
    const error = new AiUnavailableError(telemetry.last_error);
    error.status = res.status;
    throw error;
  }

  const json = await res.json();
  recordCall(model, json?.usage);
  telemetry.reachable = true;
  telemetry.last_error = null;
  telemetry.last_check_at = new Date().toISOString();

  const content = json?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}

/**
 * Requests strict JSON from Qwen, validates it against a zod schema,
 * and retries exactly once with a stricter reminder if the output is malformed.
 */
export async function chatJson({
  system,
  user,
  schema,
  model = config.dashscope.models.reasoning,
  temperature = 0.2,
  maxTokens = 1800,
  label = 'agent',
}) {
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  const attempt = async (msgs) => {
    const text = await rawChat({ model, messages: msgs, temperature, maxTokens, jsonMode: true });
    const parsed = extractJson(text);
    if (parsed === null) return { ok: false, reason: 'not-json', text };
    const result = schema.safeParse(parsed);
    if (!result.success) {
      return {
        ok: false,
        reason: 'schema',
        text,
        issues: result.error.issues.slice(0, 6).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
      };
    }
    return { ok: true, data: result.data };
  };

  const first = await attempt(messages);
  if (first.ok) return { data: first.data, model, retried: false };

  telemetry.json_retries += 1;
  const correction =
    first.reason === 'schema'
      ? `Your previous response did not match the required schema. Problems: ${(first.issues || []).join('; ')}. Respond again with ONLY a single valid JSON object matching the schema exactly. No prose, no markdown fences.`
      : 'Your previous response was not valid JSON. Respond again with ONLY a single valid JSON object. No prose, no markdown fences.';

  const second = await attempt([
    ...messages,
    { role: 'assistant', content: String(first.text || '').slice(0, 2000) },
    { role: 'user', content: correction },
  ]);
  if (second.ok) return { data: second.data, model, retried: true };

  throw new AiInvalidJsonError(
    `The ${label} agent returned a response that could not be validated after a retry.`,
  );
}

export async function chatText({ system, user, model = config.dashscope.models.fast, temperature = 0.4, maxTokens = 800 }) {
  return rawChat({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature,
    maxTokens,
  });
}

/** Lightweight connectivity probe used by the Settings page. */
export async function probeDashScope() {
  if (!aiEnabled()) {
    telemetry.configured = false;
    telemetry.reachable = null;
    telemetry.last_error = 'DASHSCOPE_API_KEY is not set in .env';
    telemetry.last_check_at = new Date().toISOString();
    return getAiTelemetry();
  }
  try {
    const text = await rawChat({
      model: config.dashscope.models.fast,
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
      temperature: 0,
      maxTokens: 8,
    });
    telemetry.reachable = true;
    telemetry.last_error = null;
    telemetry.probe_reply = String(text).trim().slice(0, 40);
  } catch (err) {
    telemetry.reachable = false;
    telemetry.last_error = err.message;
  }
  telemetry.last_check_at = new Date().toISOString();
  return getAiTelemetry();
}

export { extractJson };
