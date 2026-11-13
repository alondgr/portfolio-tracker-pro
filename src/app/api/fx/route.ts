import { NextResponse } from 'next/server';
import { fetchWithStaleFallback, CachedQuoteResult } from '@/lib/quoteFailover';

interface FxPayload {
  rates?: Record<string, number>;
}

let lastGoodFxCache: CachedQuoteResult<FxPayload> | null = {
  data: { rates: { USD: 1.0, ILS: 3.70, EUR: 0.92, GBP: 0.79 } },
  isStale: false,
  lastGoodTimestamp: Date.now(),
};

export async function GET() {
  try {
    const headers: Record<string, string> = {};
    if (process.env.FX_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.FX_API_KEY}`;
    }

    const result = await fetchWithStaleFallback<FxPayload>(
      () =>
        fetch('https://api.exchangerate-api.com/v4/latest/USD', {
          headers,
          next: { revalidate: 120 }, // 2-min cache
        }),
      lastGoodFxCache
    );

    if (!result.isStale) {
      lastGoodFxCache = result;
    }

    const rates = result.data.rates || { USD: 1.0, ILS: 3.70 };
    return NextResponse.json({
      rate: rates.ILS || 3.70,
      rates,
      isStale: result.isStale,
      lastGoodTimestamp: result.lastGoodTimestamp,
      status: result.isStale ? 'STALE_FALLBACK' : 'LIVE',
    });
  } catch (err: any) {
    const isAuthError = String(err?.message || '').startsWith('Auth/Config Error');
    return NextResponse.json(
      {
        error: err?.message || 'Gateway error',
        status: isAuthError ? 'AUTH_CONFIG_ERROR' : 'ERROR_FALLBACK',
      },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
