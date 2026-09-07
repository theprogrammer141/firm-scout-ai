import { config } from '../config.js';
import { tooMany } from './errors.js';

/** In-memory fixed-window limiter for expensive AI endpoints. */
export function rateLimit({ windowMs = config.rateLimit.windowMs, max = config.rateLimit.max } = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        return next(
          tooMany(`Too many AI requests. Please wait ${retryAfter}s before trying again.`),
        );
      }
    }

    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
    }
    return next();
  };
}
