export interface CachedQuoteResult<T> {
  data: T;
  isStale: boolean;
  lastGoodTimestamp: number;
}

/**
 * Executes an HTTP fetch with explicit error classification:
 * - 401 / 403: Immediately throws Auth/Config Error (never masked by stale cache)
 * - 429 / 5xx / Network timeout: Serves `lastGoodCache` tagged with `isStale: true`
 *   so financial metrics never render $0.00 or blank dashes during upstream throttling.
 */
export async function fetchWithStaleFallback<T>(
  fetcher: () => Promise<Response>,
  lastGoodCache: CachedQuoteResult<T> | null
): Promise<CachedQuoteResult<T>> {
  try {
    const res = await fetcher();

    if (res.status === 401 || res.status === 403) {
      throw new Error(`Auth/Config Error (${res.status}): Check API credentials`);
    }

    if (!res.ok) {
      // 429 or 5xx: fall back to last-good cache instead of zeroing UI metrics
      if (lastGoodCache) {
        return { ...lastGoodCache, isStale: true };
      }
      throw new Error(`Upstream Market API failed with status ${res.status}`);
    }

    const freshData: T = await res.json();
    return {
      data: freshData,
      isStale: false,
      lastGoodTimestamp: Date.now(),
    };
  } catch (err: any) {
    if (String(err?.message || '').startsWith('Auth/Config Error')) {
      throw err;
    }
    if (lastGoodCache) {
      return { ...lastGoodCache, isStale: true };
    }
    throw err;
  }
}
