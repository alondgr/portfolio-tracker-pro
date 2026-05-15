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
    if (!userId) return NextResponse.json({ data: [] });

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
    if (!symbols.includes('^GSPC')) symbols.push('^GSPC');
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
        if (cleanSymbol === 'GOLD') cleanSymbol = 'GC=F';
        if (cleanSymbol === 'BTC') cleanSymbol = 'BTC-USD';

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

    let initialSp500Price: number | null = null;

    let cumulativeTwr = 0;
    let previousValue = 0;
    let previousShares: Record<string, number> = {};

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      let totalValue = 0;
      let totalCostBasis = 0;

      let valueBeforeCf = 0;
      let currentShares: Record<string, number> = {};

      holdings.forEach((h: any) => {
        if (h.symbol === '^GSPC') return; // Skip S&P500 in total value calculation if it was added to holdings
        
        // Calculate shares held ON this date
        let shares = 0;
        let costBasis = 0;

        h.transactions?.forEach((t: any) => {
          const txnDate = new Date(t.date);
          txnDate.setHours(0, 0, 0, 0);
          
          if (txnDate <= currentDate) {
            const qty = Number(t.quantity);
            const price = Number(t.price);
            
            if (t.type === 'BUY') {
              shares += qty;
              costBasis += (qty * price);
            } else {
              if (shares > 0) {
                const avgCost = costBasis / shares;
                shares -= qty;
                costBasis -= (qty * avgCost);
              } else {
                shares -= qty;
              }
            }
          }
        });

        currentShares[h.symbol] = shares;

        if (shares > 0 || (previousShares[h.symbol] && previousShares[h.symbol] > 0)) {
          totalCostBasis += costBasis;

          // Find price for this date
          const prices = historicalData[h.symbol] || [];
          const priceObj = prices.find(p => {
            const pDate = new Date(p.date);
            return pDate.toISOString().split('T')[0] === dateStr;
          });
          
          let priceToUse: number | undefined = undefined;
          if (priceObj && priceObj.close !== undefined) {
            priceToUse = priceObj.close;
          } else if (lastKnownPrices[h.symbol] !== undefined) {
            priceToUse = lastKnownPrices[h.symbol];
          } else {
            // fallback: find next available price if starting on a weekend
            const nextP = prices.find(p => new Date(p.date) > currentDate && p.close !== undefined);
            if (nextP) priceToUse = nextP.close;
          }

          if (priceToUse !== undefined) {
            if (previousShares[h.symbol]) {
              valueBeforeCf += previousShares[h.symbol] * priceToUse;
            }
            if (shares > 0) {
              totalValue += shares * priceToUse;
            }
            lastKnownPrices[h.symbol] = priceToUse;
          }
        }
      });

      // Calculate Daily TWR
      let dailyReturn = 0;
      if (previousValue > 0) {
        dailyReturn = (valueBeforeCf - previousValue) / previousValue;
      } else if (totalCostBasis > 0) {
        // First day of investment, capture the intraday return
        dailyReturn = (totalValue - totalCostBasis) / totalCostBasis;
      }
      cumulativeTwr = (1 + cumulativeTwr) * (1 + dailyReturn) - 1;
      
      // Update for next iteration
      previousValue = totalValue;
      previousShares = currentShares;

      // Find SP500 price for this date
      let sp500Price = 0;
      const sp500Prices = historicalData['^GSPC'] || [];
      const sp500PriceObj = sp500Prices.find(p => {
        const pDate = new Date(p.date);
        return pDate.toISOString().split('T')[0] === dateStr;
      });
      if (sp500PriceObj && sp500PriceObj.close !== undefined) {
        sp500Price = sp500PriceObj.close;
        lastKnownPrices['^GSPC'] = sp500Price;
      } else if (lastKnownPrices['^GSPC'] !== undefined) {
        sp500Price = lastKnownPrices['^GSPC'];
      } else {
        const nextP = sp500Prices.find(p => new Date(p.date) > currentDate && p.close !== undefined);
        if (nextP) {
          sp500Price = nextP.close;
          lastKnownPrices['^GSPC'] = sp500Price;
        }
      }

      if (initialSp500Price === null && sp500Price > 0) {
        initialSp500Price = sp500Price;
      }
      
      let sp500Cumulative = 0;
      if (initialSp500Price && initialSp500Price > 0) {
        sp500Cumulative = (sp500Price - initialSp500Price) / initialSp500Price;
      }

      timeline.push({ 
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: dateStr,
        value: Number(totalValue.toFixed(2)),
        portfolioReturn: Number((cumulativeTwr * 100).toFixed(2)),
        sp500Return: Number((sp500Cumulative * 100).toFixed(2))
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({ data: timeline });
  } catch (error: any) {
    console.error('Performance API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
