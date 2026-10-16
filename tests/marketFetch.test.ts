import test from 'node:test';
import assert from 'node:assert';
import { validateUtcTimestampDrift } from '../src/lib/marketFetch';

test('validateUtcTimestampDrift accepts synchronized UTC timestamps within 30s', () => {
  const nowIso = new Date().toISOString();
  const res = validateUtcTimestampDrift(nowIso);
  assert.strictEqual(res.valid, true);
  assert.ok(res.driftMs < 5000);
});

test('validateUtcTimestampDrift rejects timestamps drifting by more than 30s', () => {
  const staleIso = new Date(Date.now() - 45_000).toISOString();
  const res = validateUtcTimestampDrift(staleIso);
  assert.strictEqual(res.valid, false);
  assert.ok(res.driftMs >= 45_000);
});
