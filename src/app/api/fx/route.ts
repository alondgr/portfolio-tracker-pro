import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const headers: Record<string, string> = {};
    if (process.env.FX_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.FX_API_KEY}`;
    }

    const upstream = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      headers,
      next: { revalidate: 120 }, // 2-min cache
    });

    if (upstream.status === 429) {
      console.warn('FX rate limit reached, returning cached fallback');
      return NextResponse.json({ rate: 3.70, status: 'RATE_LIMITED_FALLBACK' });
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { rate: 3.70, status: 'ERROR_FALLBACK', error: 'Upstream FX unavailable' },
        { status: upstream.status }
      );
    }

    // Explicitly parse and re-wrap payload through NextResponse.json() to prevent raw response header leaks (CVE-2026-119348)
    const data = await upstream.json();
    return NextResponse.json({
      rate: data.rates?.ILS || 3.70,
      rates: data.rates,
      status: 'LIVE',
    });
  } catch (err: any) {
    return NextResponse.json({
      rate: 3.70,
      status: 'ERROR_FALLBACK',
      error: err?.message || 'Gateway error',
    });
  }
}
