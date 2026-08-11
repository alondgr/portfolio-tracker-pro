import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import yf from 'yahoo-finance2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Public API - allowed for Ghost users

    const yahooFinance = new (yf.YahooFinance || yf)();
    const quote = await yahooFinance.quote(symbol);
    return NextResponse.json({ 
      price: quote?.regularMarketPrice || quote?.postMarketPrice || 0 
    });
  } catch (error: any) {
    console.error('Price API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
