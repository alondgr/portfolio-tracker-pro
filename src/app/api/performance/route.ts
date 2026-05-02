export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import yf from 'yahoo-finance2';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterSymbols = searchParams.get('symbols')?.split(',');
  
  const yahooFinance = new (yf.YahooFinance || yf)();
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const where: any = { userId };
    if (filterSymbols && filterSymbols.length > 0) {
      where.symbol = { in: filterSymbols };
    }

    const dbTransactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    if (!dbTransactions || dbTransactions.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Group transactions by symbol for the logic
    const holdingsMap: Record<string, any> = {};
    dbTransactions.forEach(t => {
      if (!holdingsMap[t.symbol]) {
        holdingsMap[t.symbol] = {
          symbol: t.symbol,
          transactions: []
        };
      }
      holdingsMap[t.symbol].transactions.push({
        id: t.id,
        type: t.type,
        date: t.date,
        quantity: t.quantity,
        price: t.avgBuyPrice
      });
    });
    const holdings = Object.values(holdingsMap);

    // 1. Get all unique symbols and find inception date
    const symbols = Array.from(new Set(holdings.map((h: any) => h.symbol)));
    let minDate = new Date();
    holdings.forEach((h: any) => {
      h.transactions?.forEach((t: any) => {
        const d = new Date(t.date);
        if (d < minDate) minDate = d;
      });
    });

    // 2. Fetch historical data for each symbol
    const historicalData: Record<string, any[]> = {};
    const today = new Date();
    
    await Promise.all(symbols.map(async (symbol) => {
      try {
        // Fix for common name errors in symbols
        let cleanSymbol = (symbol as string).toUpperCase();
        if (cleanSymbol === 'MICROSOFT') cleanSymbol = 'MSFT';
        if (cleanSymbol === 'INTEL') cleanSymbol = 'INTC';
        if (cleanSymbol === 'GOOGLE') cleanSymbol = 'GOOGL';
        if (cleanSymbol === 'APPLE') cleanSymbol = 'AAPL';

        let result = await yahooFinance.historical(cleanSymbol, {
          period1: minDate,
          period2: today,
          interval: '1d'
        });

        // Fallback for simulated future dates (Yahoo won't have 2026 data yet)
        if (!result || result.length === 0) {
          const fbStart = new Date(minDate);
          fbStart.setFullYear(fbStart.getFullYear() - 2);
          const fbEnd = new Date(today);
          fbEnd.setFullYear(fbEnd.getFullYear() - 2);

          const fallbackResult = await yahooFinance.historical(cleanSymbol, {
            period1: fbStart,
            period2: fbEnd,
            interval: '1d'
          });

          if (fallbackResult && fallbackResult.length > 0) {
            result = fallbackResult.map(p => {
              const d = new Date(p.date);
              d.setFullYear(d.getFullYear() + 2);
              return { ...p, date: d };
            });
          }
        }

        historicalData[symbol as string] = result || [];
      } catch (e) {
        console.warn(`Failed to fetch historical for ${symbol}`, e);
        historicalData[symbol as string] = [];
      }
    }));

    // 3. Generate daily timeline from minDate to today
    const timeline: any[] = [];
    // Normalize today and currentDate to midnight for comparison
    today.setHours(23, 59, 59, 999);
    let currentDate = new Date(minDate);
    currentDate.setHours(0, 0, 0, 0);

    // Keep track of last known prices to fill weekends/holidays
    const lastKnownPrices: Record<string, number> = {};

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      let totalValue = 0;

      holdings.forEach((h: any) => {
        // Calculate shares held ON this date
        let shares = 0;
        h.transactions?.forEach((t: any) => {
          const txnDate = new Date(t.date);
          txnDate.setHours(0, 0, 0, 0);
          if (txnDate <= currentDate) {
            shares += (t.type === 'BUY' ? Number(t.quantity) : -Number(t.quantity));
          }
        });

        if (shares > 0) {
          // Find price for this date
          const prices = historicalData[h.symbol] || [];
          const priceObj = prices.find(p => {
            const pDate = new Date(p.date);
            return pDate.toISOString().split('T')[0] === dateStr;
          });
          
          if (priceObj && priceObj.close !== undefined) {
            const price = priceObj.close;
            totalValue += shares * price;
            lastKnownPrices[h.symbol] = price;
          } else if (lastKnownPrices[h.symbol] !== undefined) {
            totalValue += shares * lastKnownPrices[h.symbol];
          }
        }
      });

      timeline.push({ 
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        value: Number(totalValue.toFixed(2))
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({ data: timeline });
  } catch (error: any) {
    console.error('Performance API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
