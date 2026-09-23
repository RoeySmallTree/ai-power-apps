import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AipaError, shouldRetry } from '../src/index.js';

const envelope = (code: string, retryable: boolean) =>
  ({ error: { code, message: 'x', retryable } }) as never;
const err = (code: string, status = 500) => new AipaError(status, envelope(code, true));
const transport = new AipaError(0, undefined, undefined, new Error('socket hang up'));

test('reads and record actions repeat on 429, provider failures and lost responses', () => {
  for (const kind of ['read', 'record'] as const) {
    assert.equal(shouldRetry(err('rate_limited', 429), kind, { mutating: false }), true);
    assert.equal(shouldRetry(err('provider_timeout', 504), kind, { mutating: false }), true);
    assert.equal(shouldRetry(err('provider_error', 502), kind, { mutating: false }), true);
    assert.equal(shouldRetry(transport, kind, { mutating: false }), true);
    assert.equal(shouldRetry(err('invalid_request', 400), kind, { mutating: false }), false);
  }
});

test('search and execute never repeat by default; opt-in covers 429 only', () => {
  for (const kind of ['search', 'execute'] as const) {
    for (const code of ['rate_limited', 'provider_timeout', 'provider_error']) {
      assert.equal(shouldRetry(err(code), kind, { mutating: false }), false, `${kind} ${code}`);
    }
    assert.equal(shouldRetry(transport, kind, { mutating: false }), false);
    assert.equal(shouldRetry(err('rate_limited', 429), kind, { mutating: true }), true);
    assert.equal(shouldRetry(err('provider_timeout', 504), kind, { mutating: true }), false);
    assert.equal(shouldRetry(transport, kind, { mutating: true }), false);
  }
});

test('sharpen and non-API errors never repeat', () => {
  assert.equal(shouldRetry(err('rate_limited', 429), 'sharpen', { mutating: true }), false);
  assert.equal(shouldRetry(new Error('nope'), 'read', { mutating: true }), false);
});

test('AipaError parses Retry-After and carries the envelope', () => {
  const e = new AipaError(429, envelope('rate_limited', true), new Headers({ 'retry-after': '1' }));
  assert.equal(e.retryAfterSeconds, 1);
  assert.equal(e.code, 'rate_limited');
  assert.equal(e.retryable, true);
  assert.equal(transport.code, 'transport');
  assert.equal(transport.status, 0);
});
