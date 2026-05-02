import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import yf from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Public API - allowed for Ghost users

    const yahooFinance = new (yf.YahooFinance || yf)();
    
    // We fetch common currency pairs relative to USD
    // USD is the base for most stock prices in this app (Yahoo Finance defaults)
    const symbols = ['USDILS=X', 'USDEUR=X', 'USDGBP=X'];
    const quotes = await yahooFinance.quote(symbols);
    
    const rates: Record<string, number> = {
      USD: 1.0,
    };

    if (Array.isArray(quotes)) {
      quotes.forEach((q: any) => {
        if (q.symbol === 'USDILS=X') rates.ILS = q.regularMarketPrice;
        if (q.symbol === 'USDEUR=X') rates.EUR = q.regularMarketPrice;
        if (q.symbol === 'USDGBP=X') rates.GBP = q.regularMarketPrice;
      });
    }

    return NextResponse.json({ rates });
  } catch (error: any) {
    console.error('Exchange Rates API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
