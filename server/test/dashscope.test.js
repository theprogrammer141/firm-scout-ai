import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson, AiUnavailableError, AiInvalidJsonError, getAiTelemetry } from '../src/lib/dashscope.js';

describe('extractJson', () => {
  it('extracts JSON object from text', () => {
    const text = 'Here is the result: {"name": "test", "value": 42} done';
    const result = extractJson(text);
    assert.deepEqual(result, { name: 'test', value: 42 });
  });

  it('strips markdown fences', () => {
    const text = '```json\n{"key": "value"}\n```';
    const result = extractJson(text);
    assert.deepEqual(result, { key: 'value' });
  });

  it('extracts JSON array', () => {
    const text = 'Result: [1, 2, 3]';
    const result = extractJson(text);
    assert.deepEqual(result, [1, 2, 3]);
  });

  it('handles nested objects', () => {
    const text = '{"a": {"b": {"c": true}}}';
    const result = extractJson(text);
    assert.deepEqual(result, { a: { b: { c: true } } });
  });

  it('returns null for no JSON', () => {
    assert.equal(extractJson('no json here'), null);
    assert.equal(extractJson(''), null);
    assert.equal(extractJson(null), null);
  });

  it('handles strings with braces in values', () => {
    const text = '{"message": "use {braces} carefully"}';
    const result = extractJson(text);
    assert.ok(result);
    assert.equal(result.message, 'use {braces} carefully');
  });
});

describe('Error classes', () => {
  it('AiUnavailableError has correct properties', () => {
    const err = new AiUnavailableError('test error');
    assert.equal(err.name, 'AiUnavailableError');
    assert.equal(err.code, 'AI_UNAVAILABLE');
    assert.equal(err.message, 'test error');
    assert.ok(err instanceof Error);
  });

  it('AiInvalidJsonError has correct properties', () => {
    const err = new AiInvalidJsonError('bad json');
    assert.equal(err.name, 'AiInvalidJsonError');
    assert.equal(err.code, 'AI_INVALID_JSON');
    assert.ok(err instanceof Error);
  });
});

describe('getAiTelemetry', () => {
  it('returns telemetry object', () => {
    const tel = getAiTelemetry();
    assert.ok(typeof tel === 'object');
    assert.ok('configured' in tel);
    assert.ok('calls_total' in tel);
    assert.ok('models' in tel);
    assert.ok('base_url' in tel);
  });
});
