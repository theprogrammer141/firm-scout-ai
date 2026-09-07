import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../src/lib/rateLimit.js';

describe('rateLimit', () => {
  it('allows requests within limit', () => {
    const limiter = rateLimit({ windowMs: 60000, max: 5 });
    const req = { ip: '127.0.0.1' };

    for (let i = 0; i < 5; i++) {
      let called = false;
      let passedError = null;
      const res = { setHeader: () => {} };
      const next = (err) => { called = true; passedError = err || null; };
      limiter(req, res, next);
      assert.ok(called, `Request ${i + 1} should have called next()`);
      assert.equal(passedError, null, `Request ${i + 1} should not have an error`);
    }
  });

  it('blocks requests exceeding limit', () => {
    const limiter = rateLimit({ windowMs: 60000, max: 2 });
    const req = { ip: '10.0.0.1' };
    const res = { setHeader: () => {} };

    // First 2 should pass
    for (let i = 0; i < 2; i++) {
      let passedError = null;
      limiter(req, res, (err) => { passedError = err || null; });
      assert.equal(passedError, null);
    }

    // 3rd should be blocked
    let blockedError = null;
    limiter(req, res, (err) => { blockedError = err; });
    assert.ok(blockedError, 'Third request should receive an error');
    assert.equal(blockedError.status, 429);
  });
});
