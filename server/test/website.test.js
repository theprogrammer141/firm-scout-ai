import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHtml } from '../src/lib/website.js';

describe('analyzeHtml', () => {
  it('analyzes basic HTML structure', () => {
    const html = `<!DOCTYPE html><html><head><title>Test</title><meta name="description" content="A test page"></head>
    <body><h1>Welcome</h1><p>Content here</p><a href="/contact">Contact</a></body></html>`;
    const result = analyzeHtml(html, { url: 'https://example.com' });
    assert.ok(result.scores);
    assert.ok(typeof result.scores.overall === 'number');
    assert.ok(Array.isArray(result.evidence));
  });

  it('detects missing elements', () => {
    const html = '<html><body><p>Minimal</p></body></html>';
    const result = analyzeHtml(html, { url: 'https://example.com' });
    assert.ok(result.scores.overall < 50);
  });

  it('scores rich HTML higher', () => {
    const rich = `<!DOCTYPE html><html><head><title>Rich Site</title><meta name="description" content="desc">
    <link rel="stylesheet" href="style.css"></head><body>
    <header><nav><a href="/">Home</a><a href="/about">About</a></nav></header>
    <main><h1>Welcome</h1><form action="/submit"><input name="email" type="email"><button>Submit</button></form>
    <a href="https://facebook.com">Facebook</a><a href="https://instagram.com">Instagram</a></main>
    <script src="app.js"></script></body></html>`;
    const poor = '<html><body>Hello</body></html>';

    const richResult = analyzeHtml(rich, { url: 'https://rich.com' });
    const poorResult = analyzeHtml(poor, { url: 'https://poor.com' });
    assert.ok(richResult.scores.overall > poorResult.scores.overall);
  });

  it('handles empty HTML', () => {
    const result = analyzeHtml('', { url: 'https://example.com' });
    assert.ok(result.scores.overall === 0 || result.scores.overall < 10);
  });
});
