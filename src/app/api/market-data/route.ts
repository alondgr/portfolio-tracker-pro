import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import yf from 'yahoo-finance2';
import { validateUtcTimestampDrift } from '@/lib/marketFetch';

export const revalidate = 60; // 60-second shared edge cache

const QUOTE_CACHE_TTL_MS = 60 * 1000;
const quoteBatchCache = new Map<string, { timestamp: number; results: any[] }>();

export async function GET(request: Request) {
  try {
    const reqTimestamp = request.headers.get('X-Request-Timestamp');
    const driftCheck = validateUtcTimestampDrift(reqTimestamp);
    if (!driftCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid Timestamp: request clock drift exceeds 30s UTC window', driftMs: driftCheck.driftMs },
        { status: 403 }
      );
    }

    // Public API - allowed for Ghost users
    const { searchParams } = new URL(request.url);
    const querySymbols = searchParams.get('symbols');

    const yahooFinance = new (yf.YahooFinance || yf)();
    
    // Global Indices and major assets OR requested user symbols
    const symbols = querySymbols ? querySymbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [
      '^GSPC', // S&P 500
      '^IXIC', // NASDAQ
      '^DJI',  // Dow Jones
      'BTC-USD', 
      'ETH-USD', 
      'GC=F',   // Gold
      'SI=F',   // Silver
      'HG=F',   // Copper
      'CL=F',   // WTI Crude Oil
      'VNQ',    // Real Estate
      '^VIX',   // VIX
      '^TNX',   // 10Y Yield
      'DX-Y.NYB' // DXY
    ];

    const cacheKey = symbols.slice().sort().join(',');
    const cached = quoteBatchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL_MS) {
      return NextResponse.json(
        { results: cached.results, cached: true },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' } }
      );
    }

    // Single batch request for all symbols to respect provider burst rate limits
    const quotes = await yahooFinance.quote(symbols);
    
    let results = (Array.isArray(quotes) ? quotes : [quotes]).map((q: any) => ({
      symbol: q.symbol,
      price: q.regularMarketPrice || q.postMarketPrice || 0,
      change: q.regularMarketChangePercent || 0,
      changeAbs: q.regularMarketChange || 0,
      name: q.shortName || q.symbol,
      currency: q.currency || 'USD'
    }));

    if (querySymbols) {
      results = await Promise.all(results.map(async (r: any) => {
        let sector = "Unknown";
        let industry = "Unknown";
        let explanation = "";
        try {
          const summary = (await yahooFinance.quoteSummary(r.symbol, { modules: ['assetProfile'] })) as any;
          sector = summary.assetProfile?.sector || "Unknown";
          industry = summary.assetProfile?.industry || "Unknown";
          explanation = summary.assetProfile?.longBusinessSummary || "";
        } catch (e) {
          // ignore error if profile not found
        }
        return { ...r, sector, industry, explanation };
      }));
    }

    quoteBatchCache.set(cacheKey, { timestamp: Date.now(), results });

    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' } }
    );
  } catch (error: any) {
    console.error('Market Data API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
