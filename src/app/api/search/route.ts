import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import yf from 'yahoo-finance2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.length < 1) {
    return NextResponse.json({ result: [] });
  }

  try {
    const { userId } = auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const yahooFinance = new (yf.YahooFinance || yf)();
    const result = await yahooFinance.search(query);
    // Filter to only include equities/stocks and relevant types
    const quotes = Array.isArray(result) ? result : (result.quotes || []);
    const suggestions = quotes
      .filter((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.type === 'EQUITY'))
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol || 'Unknown Name',
        exchange: q.exchDisp || q.exchange || 'Unknown'
      }))
      .slice(0, 8); // Limit to top 8 results

    return NextResponse.json({ result: suggestions });
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
