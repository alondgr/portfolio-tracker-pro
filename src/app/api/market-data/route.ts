import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import yf from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Public API - allowed for Ghost users
    const { searchParams } = new URL(request.url);
    const querySymbols = searchParams.get('symbols');

    const yahooFinance = new (yf.YahooFinance || yf)();
    
    // Global Indices and major assets OR requested user symbols
    const symbols = querySymbols ? querySymbols.split(',') : [
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
        try {
          const summary = (await yahooFinance.quoteSummary(r.symbol, { modules: ['assetProfile'] })) as any;
          sector = summary.assetProfile?.sector || "Unknown";
          industry = summary.assetProfile?.industry || "Unknown";
        } catch (e) {
          // ignore error if profile not found
        }
        return { ...r, sector, industry };
      }));
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Market Data API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
