const { PrismaClient } = require('@prisma/client');
const yf = require('yahoo-finance2').default;

const prisma = new PrismaClient();

async function run() {
  const userId = "user_2gXwDkYdE3S3YJ0E1lRkOqG1bM2"; // We might not know the exact userId, let's just fetch all transactions for testing, or assume a single user.
  
  const allTxns = await prisma.transaction.findMany({ orderBy: { date: 'asc' } });
  if (!allTxns.length) {
    console.log("No transactions found.");
    return;
  }

  // Group by symbol
  const holdingsMap = {};
  allTxns.forEach(t => {
    if (!holdingsMap[t.symbol]) holdingsMap[t.symbol] = { symbol: t.symbol, transactions: [] };
    holdingsMap[t.symbol].transactions.push({
      id: t.id, type: t.type, date: t.date, quantity: t.quantity, price: t.avgBuyPrice
    });
  });
  const holdings = Object.values(holdingsMap);
  const symbols = Array.from(new Set(holdings.map(h => h.symbol)));
  if (!symbols.includes('^GSPC')) symbols.push('^GSPC');

  let minDate = new Date();
  holdings.forEach((h) => {
    h.transactions?.forEach((t) => {
      const d = new Date(t.date);
      if (d < minDate) minDate = d;
    });
  });

  const historicalData = {};
  const today = new Date();
  
  await Promise.all(symbols.map(async (symbol) => {
    try {
      let cleanSymbol = symbol.toUpperCase();
      if (cleanSymbol === 'MICROSOFT') cleanSymbol = 'MSFT';
      if (cleanSymbol === 'INTEL') cleanSymbol = 'INTC';
      if (cleanSymbol === 'GOOGLE') cleanSymbol = 'GOOGL';
      if (cleanSymbol === 'APPLE') cleanSymbol = 'AAPL';
      if (cleanSymbol === 'GOLD') cleanSymbol = 'GC=F'; // Added just in case
      if (cleanSymbol === 'BTC') cleanSymbol = 'BTC-USD';

      let result = await yf.historical(cleanSymbol, { period1: minDate, period2: today, interval: '1d' });
      if (!result || result.length === 0) {
        const fbStart = new Date(minDate); fbStart.setFullYear(fbStart.getFullYear() - 2);
        const fbEnd = new Date(today); fbEnd.setFullYear(fbEnd.getFullYear() - 2);
        const fallbackResult = await yf.historical(cleanSymbol, { period1: fbStart, period2: fbEnd, interval: '1d' });
        if (fallbackResult && fallbackResult.length > 0) {
          result = fallbackResult.map(p => {
            const d = new Date(p.date); d.setFullYear(d.getFullYear() + 2); return { ...p, date: d };
          });
        }
      }
      historicalData[symbol] = result || [];
    } catch (e) {
      console.warn(`Failed to fetch historical for ${symbol}`, e.message);
      historicalData[symbol] = [];
    }
  }));

  // Find missing starting prices
  symbols.forEach(symbol => {
      if (!historicalData[symbol] || historicalData[symbol].length === 0) {
          console.error(`ERROR: Ticker ${symbol} returned NO historical data!`);
      } else {
          // Check for zeros
          const zeroPrices = historicalData[symbol].filter(p => p.close === 0);
          if (zeroPrices.length > 0) {
              console.error(`ERROR: Ticker ${symbol} returned $0 prices on some dates!`);
          }
      }
  });

  const timeline = [];
  today.setHours(23, 59, 59, 999);
  let currentDate = new Date(minDate);
  currentDate.setHours(0, 0, 0, 0);

  const lastKnownPrices = {};
  let cumulativeTWR = 0;
  let prevTotalValue = 0;
  let initialSp500Price = null;

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    let totalValue = 0;
    let dailyCashFlow = 0;

    holdings.forEach((h) => {
      if (h.symbol === '^GSPC') return;
      
      let shares = 0;
      h.transactions?.forEach((t) => {
        const txnDate = new Date(t.date);
        txnDate.setHours(0, 0, 0, 0);
        if (txnDate <= currentDate) {
          shares += (t.type === 'BUY' ? Number(t.quantity) : -Number(t.quantity));
        }
        if (txnDate.getTime() === currentDate.getTime()) {
          const cost = Number(t.quantity) * Number(t.price);
          if (t.type === 'BUY') dailyCashFlow += cost;
          if (t.type === 'SELL') dailyCashFlow -= cost;
        }
      });

      if (shares > 0) {
        const prices = historicalData[h.symbol] || [];
        const priceObj = prices.find(p => {
          const pDate = new Date(p.date);
          return pDate.toISOString().split('T')[0] === dateStr;
        });
        
        let priceToUse = undefined;
        if (priceObj && priceObj.close !== undefined) {
          priceToUse = priceObj.close;
        } else if (lastKnownPrices[h.symbol] !== undefined) {
          priceToUse = lastKnownPrices[h.symbol];
        } else {
            // Find next available price if missing at the start
            const nextPriceObj = prices.find(p => new Date(p.date) > currentDate && p.close !== undefined);
            if (nextPriceObj) priceToUse = nextPriceObj.close;
        }

        if (priceToUse !== undefined) {
            totalValue += shares * priceToUse;
            lastKnownPrices[h.symbol] = priceToUse;
        } else {
            console.error(`WARNING: No price found for ${h.symbol} on ${dateStr} and no fallback available.`);
        }
      }
    });

    let dailyReturn = 0;
    if (prevTotalValue > 0) {
      dailyReturn = (totalValue - dailyCashFlow - prevTotalValue) / prevTotalValue;
    } else if (dailyCashFlow > 0 && totalValue > 0) {
      dailyReturn = (totalValue - dailyCashFlow) / dailyCashFlow;
    } else if (dailyCashFlow > 0 && totalValue === 0) {
        console.error(`FATAL: totalValue is 0 but dailyCashFlow > 0 on ${dateStr}. This causes -100% drop.`);
    }
    
    cumulativeTWR = ((1 + cumulativeTWR) * (1 + dailyReturn)) - 1;
    prevTotalValue = totalValue;

    let sp500Price = 0;
    const sp500Prices = historicalData['^GSPC'] || [];
    const sp500PriceObj = sp500Prices.find(p => new Date(p.date).toISOString().split('T')[0] === dateStr);
    
    if (sp500PriceObj && sp500PriceObj.close !== undefined) {
      sp500Price = sp500PriceObj.close;
      lastKnownPrices['^GSPC'] = sp500Price;
    } else if (lastKnownPrices['^GSPC'] !== undefined) {
      sp500Price = lastKnownPrices['^GSPC'];
    } else {
        const nextPriceObj = sp500Prices.find(p => new Date(p.date) > currentDate && p.close !== undefined);
        if (nextPriceObj) {
            sp500Price = nextPriceObj.close;
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
      dateStr,
      totalValue,
      dailyCashFlow,
      dailyReturn,
      cumulativeTWR: cumulativeTWR * 100,
      sp500Price,
      sp500Cumulative: sp500Cumulative * 100
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log("\n--- DEBUG SUMMARY ---");
  if (timeline.length > 0) {
      const first = timeline[0];
      const last = timeline[timeline.length - 1];
      console.log(`FIRST DAY (${first.dateStr}):`);
      console.log(`  Portfolio Value: $${first.totalValue.toFixed(2)} | Cash Flow: $${first.dailyCashFlow.toFixed(2)} | Return: ${first.cumulativeTWR.toFixed(2)}%`);
      console.log(`  S&P 500 Value: ${first.sp500Price.toFixed(2)} | Return: ${first.sp500Cumulative.toFixed(2)}%`);
      
      console.log(`LAST DAY (${last.dateStr}):`);
      console.log(`  Portfolio Value: $${last.totalValue.toFixed(2)} | Cumulative TWR: ${last.cumulativeTWR.toFixed(2)}%`);
      console.log(`  S&P 500 Value: ${last.sp500Price.toFixed(2)} | Return: ${last.sp500Cumulative.toFixed(2)}%`);
  } else {
      console.log("Timeline is empty.");
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
