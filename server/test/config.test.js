import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { config, aiEnabled } from '../src/config.js';

describe('config', () => {
  it('has required fields', () => {
    assert.ok(typeof config.port === 'number');
    assert.ok(config.nodeEnv);
    assert.ok(config.dashscope);
    assert.ok(config.paths);
    assert.ok(config.paths.data);
    assert.ok(config.paths.serverRoot);
    assert.ok(config.paths.projectRoot);
  });

  it('has dashscope model config', () => {
    assert.ok(config.dashscope.models.reasoning);
    assert.ok(config.dashscope.models.fast);
    assert.ok(config.dashscope.models.vision);
  });

  it('has rate limit config', () => {
    assert.ok(typeof config.rateLimit.windowMs === 'number');
    assert.ok(typeof config.rateLimit.max === 'number');
  });
});

describe('aiEnabled', () => {
  it('returns boolean', () => {
    assert.ok(typeof aiEnabled() === 'boolean');
  });
});
