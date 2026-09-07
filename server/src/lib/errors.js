export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, 'BAD_REQUEST', message, details);
export const notFound = (message) => new AppError(404, 'NOT_FOUND', message);
export const tooMany = (message) => new AppError(429, 'RATE_LIMITED', message);
export const upstream = (message) => new AppError(502, 'UPSTREAM_ERROR', message);

/** Friendly, non-leaking error envelope. Stack traces and file paths never go out. */
export function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err?.status) ? err.status : mapKnownCode(err?.code);
  const code = err?.code || 'INTERNAL_ERROR';

  const message =
    status >= 500 && !KNOWN_SAFE_CODES.has(code)
      ? 'Something went wrong while processing this request. Please try again.'
      : err?.message || 'Request failed.';

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.path} -> ${code}: ${err?.message}`);
  }

  res.status(status).json({
    ok: false,
    error: { code, message, ...(err?.details ? { details: err.details } : {}) },
  });
}

const KNOWN_SAFE_CODES = new Set(['AI_UNAVAILABLE', 'AI_INVALID_JSON', 'UPSTREAM_ERROR', 'WEBSITE_UNREACHABLE']);

function mapKnownCode(code) {
  switch (code) {
    case 'AI_UNAVAILABLE':
      return 503;
    case 'AI_INVALID_JSON':
      return 502;
    case 'WEBSITE_UNREACHABLE':
      return 200;
    default:
      return 500;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}
