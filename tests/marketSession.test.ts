import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EOD_SNAPSHOT_CRON_UTC,
  evaluateInsiderConviction,
  evaluateQuoteFreshness,
  normalizeTradingSession,
} from '../src/lib/marketSession';

test('evaluateQuoteFreshness returns Market Closed (Last Close) when sessionState is CLOSED', () => {
  const tenHoursAgo = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
  const res = evaluateQuoteFreshness(tenHoursAgo, 'CLOSED');
  assert.equal(res.isStale, false);
  assert.equal(res.label, 'Market Closed (Last Close)');
});

test('evaluateQuoteFreshness returns Live for active regular or 23-hour overnight ticks <= 3 mins old', () => {
  const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
  const reg = evaluateQuoteFreshness(thirtySecondsAgo, 'REGULAR');
  assert.equal(reg.isStale, false);
  assert.equal(reg.label, 'Live');

  const overnight = evaluateQuoteFreshness(thirtySecondsAgo, 'EXTENDED_OVERNIGHT');
  assert.equal(overnight.isStale, false);
  assert.equal(overnight.label, 'Live');
});

test('evaluateQuoteFreshness flags ticks older than 3 minutes as Delayed Quote during active sessions', () => {
  const fiveMinutesAgo = new Date(Date.now() - 300_000).toISOString();
  const res = evaluateQuoteFreshness(fiveMinutesAgo, 'EXTENDED_OVERNIGHT');
  assert.equal(res.isStale, true);
  assert.equal(res.label, 'Delayed Quote');
});

test('normalizeTradingSession maps provider states and EOD cron targets 01:30 UTC (8:30 PM ET)', () => {
  assert.equal(normalizeTradingSession('REGULAR'), 'REGULAR');
  assert.equal(normalizeTradingSession('OVERNIGHT'), 'EXTENDED_OVERNIGHT');
  assert.equal(normalizeTradingSession('POST'), 'EXTENDED_OVERNIGHT');
  assert.equal(normalizeTradingSession('CLOSED'), 'CLOSED');
  assert.equal(EOD_SNAPSHOT_CRON_UTC, '30 1 * * 2-6');
});

test('evaluateInsiderConviction calculates net 90-day Form 3/4/5 insider accumulation and distribution', () => {
  const accumulation = evaluateInsiderConviction('NVDA', [
    { filingType: '4', transactionType: 'BUY', shares: 10_000, valueUsd: 1_200_000 },
    { filingType: '4', transactionType: 'SELL', shares: 2_000, valueUsd: 240_000 },
  ]);
  assert.equal(accumulation.trendLabel, 'Net Accumulation');
  assert.equal(accumulation.netShares90d, 8_000);
  assert.ok(accumulation.convictionScoreDelta > 0);
});
