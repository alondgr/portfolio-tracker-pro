import { NextResponse } from 'next/server';
import yf from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedTopMarketCap: { timestamp: number; results: any[] } | null = null;

// Pool of the largest global mega-cap companies traded in USD on US exchanges
const MEGACAP_POOL = [
  'AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSM', 'BRK-B', 'AVGO', 'TSLA',
  'LLY', 'WMT', 'JPM', 'V', 'XOM', 'ORCL', 'UNH', 'MA', 'NFLX', 'COST',
  'JNJ', 'PG', 'HD', 'ABBV', 'BAC', 'SAP', 'ASML', 'CRM', 'AMD', 'CVX'
];

const SECTOR_MAP: Record<string, string> = {
  AAPL: 'Technology',
  NVDA: 'Technology',
  MSFT: 'Technology',
  AMZN: 'Consumer Cyclical',
  GOOGL: 'Communication Services',
  META: 'Communication Services',
  TSM: 'Technology',
  'BRK-B': 'Financial Services',
  AVGO: 'Technology',
  TSLA: 'Consumer Cyclical',
  LLY: 'Healthcare',
  WMT: 'Consumer Defensive',
  JPM: 'Financial Services',
  V: 'Financial Services',
  XOM: 'Energy',
  ORCL: 'Technology',
  UNH: 'Healthcare',
  MA: 'Financial Services',
  NFLX: 'Communication Services',
  COST: 'Consumer Defensive',
  JNJ: 'Healthcare',
  PG: 'Consumer Defensive',
  HD: 'Consumer Cyclical',
  ABBV: 'Healthcare',
  BAC: 'Financial Services',
  SAP: 'Technology',
  ASML: 'Technology',
  CRM: 'Technology',
  AMD: 'Technology',
  CVX: 'Energy',
};

export async function GET() {
  try {
    if (cachedTopMarketCap && Date.now() - cachedTopMarketCap.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        { results: cachedTopMarketCap.results, cached: true },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' } }
      );
    }

    const yahooFinance = new (yf.YahooFinance || yf)();
    try {
      if (yahooFinance.suppressNotices) {
        yahooFinance.suppressNotices(['*']);
      }
    } catch (e) {
      // Ignore
    }

    const quotes = await yahooFinance.quote(MEGACAP_POOL);
    const quoteList = Array.isArray(quotes) ? quotes : [quotes];

    const mapped = quoteList
      .filter((q: any) => q && q.symbol && (q.marketCap || 0) > 0)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        marketCap: q.marketCap || 0,
        price: q.regularMarketPrice || q.postMarketPrice || 0,
        changePct: q.regularMarketChangePercent || 0,
        changeAbs: q.regularMarketChange || 0,
        currency: q.currency || 'USD',
        sector: SECTOR_MAP[q.symbol] || 'Equities',
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow || null,
        trailingPE: q.trailingPE || null,
      }))
      .sort((a: any, b: any) => b.marketCap - a.marketCap)
      .slice(0, 10)
      .map((item: any, idx: number) => ({
        ...item,
        rank: idx + 1,
      }));

    if (mapped.length > 0) {
      cachedTopMarketCap = { timestamp: Date.now(), results: mapped };
    }

    return NextResponse.json(
      { results: mapped, cached: false },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' } }
    );
  } catch (error: any) {
    console.error('Top Market Cap API Error:', error);
    if (cachedTopMarketCap) {
      return NextResponse.json({ results: cachedTopMarketCap.results, cached: true, stale: true });
    }
    return NextResponse.json({ error: error.message || 'Failed to fetch top market cap companies' }, { status: 500 });
  }
}
