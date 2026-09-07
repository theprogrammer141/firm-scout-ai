import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppError, badRequest, notFound, tooMany, upstream } from '../src/lib/errors.js';

describe('AppError', () => {
  it('creates error with status and code', () => {
    const err = new AppError(400, 'TEST_ERROR', 'test');
    assert.equal(err.status, 400);
    assert.equal(err.code, 'TEST_ERROR');
    assert.equal(err.message, 'test');
  });
});

describe('Error helpers', () => {
  it('badRequest creates 400', () => {
    const err = badRequest('bad input');
    assert.equal(err.status, 400);
  });

  it('notFound creates 404', () => {
    const err = notFound('missing');
    assert.equal(err.status, 404);
  });

  it('tooMany creates 429', () => {
    const err = tooMany('slow down');
    assert.equal(err.status, 429);
  });

  it('upstream creates 502', () => {
    const err = upstream('upstream failed');
    assert.equal(err.status, 502);
  });
});
