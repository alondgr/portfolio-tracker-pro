import { NextResponse } from 'next/server';
import yf from 'yahoo-finance2';

export const revalidate = 120; // 2-minute cache during month-end volatility

const DEFAULT_FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  ILS: 3.70,
  EUR: 0.92,
  GBP: 0.79,
};

let lastKnownRates: Record<string, number> = { ...DEFAULT_FALLBACK_RATES };

export async function GET() {
  try {
    const yahooFinance = new (yf.YahooFinance || yf)();

    // Common currency pairs relative to USD
    const symbols = ['USDILS=X', 'USDEUR=X', 'USDGBP=X'];
    const quotes = await yahooFinance.quote(symbols);

    const rates: Record<string, number> = {
      ...lastKnownRates,
      USD: 1.0,
    };

    if (Array.isArray(quotes)) {
      quotes.forEach((q: any) => {
        if (q.symbol === 'USDILS=X' && q.regularMarketPrice) rates.ILS = q.regularMarketPrice;
        if (q.symbol === 'USDEUR=X' && q.regularMarketPrice) rates.EUR = q.regularMarketPrice;
        if (q.symbol === 'USDGBP=X' && q.regularMarketPrice) rates.GBP = q.regularMarketPrice;
      });
    }

    lastKnownRates = { ...rates };
    return NextResponse.json({ rates, rate: rates.ILS, status: 'LIVE' });
  } catch (error: any) {
    const isRateLimited =
      error?.status === 429 ||
      String(error?.message || '').includes('429') ||
      String(error?.message || '').toLowerCase().includes('too many requests');

    if (isRateLimited) {
      console.warn('FX rate limit reached, returning cached fallback');
      return NextResponse.json({
        rates: lastKnownRates,
        rate: lastKnownRates.ILS || 3.70,
        status: 'RATE_LIMITED_FALLBACK',
      });
    }

    console.warn('Exchange Rates API fallback triggered:', error?.message);
    return NextResponse.json({
      rates: lastKnownRates,
      rate: lastKnownRates.ILS || 3.70,
      status: 'ERROR_FALLBACK',
    });
  }
}
