import test from 'node:test';
import assert from 'node:assert';
import { fetchWithStaleFallback, CachedQuoteResult } from '../src/lib/quoteFailover';

test('fetchWithStaleFallback returns fresh data on 200 OK', async () => {
  const result = await fetchWithStaleFallback<{ rate: number }>(
    async () => new Response(JSON.stringify({ rate: 3.75 }), { status: 200 }),
    null
  );

  assert.strictEqual(result.data.rate, 3.75);
  assert.strictEqual(result.isStale, false);
  assert.ok(result.lastGoodTimestamp > 0);
});

test('fetchWithStaleFallback returns stale cache on 429 or 503', async () => {
  const lastGood: CachedQuoteResult<{ rate: number }> = {
    data: { rate: 3.72 },
    isStale: false,
    lastGoodTimestamp: 1700000000000,
  };

  const result = await fetchWithStaleFallback<{ rate: number }>(
    async () => new Response('Too Many Requests', { status: 429 }),
    lastGood
  );

  assert.strictEqual(result.data.rate, 3.72);
  assert.strictEqual(result.isStale, true);
  assert.strictEqual(result.lastGoodTimestamp, 1700000000000);
});

test('fetchWithStaleFallback throws immediately on 401/403 Auth/Config Error even if cache exists', async () => {
  const lastGood: CachedQuoteResult<{ rate: number }> = {
    data: { rate: 3.72 },
    isStale: false,
    lastGoodTimestamp: 1700000000000,
  };

  await assert.rejects(
    async () =>
      fetchWithStaleFallback<{ rate: number }>(
        async () => new Response('Forbidden', { status: 403 }),
        lastGood
      ),
    /Auth\/Config Error \(403\)/
  );
});
