export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import yf from 'yahoo-finance2';

// Helper to reliably read holdings from database
async function getHoldings(userId: string) {
  try {
    const dbTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    });

    // Group transactions by symbol
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

    return Object.values(holdingsMap);
  } catch (error) {
    console.error('Error reading from database:', error);
    return [];
  }
}

// GET: Fetch our holdings, compute aggregate values from transactions, and get real-time quotes
export async function GET() {
  const yahooFinance = new (yf.YahooFinance || yf)();
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ holdings: [] });

    const rawHoldings = await getHoldings(userId);
    
    if (rawHoldings.length === 0) {
      return NextResponse.json({ holdings: [] });
    }

    // Process transactions into aggregates
    const holdings = rawHoldings.map((h: any) => {
      let totalQty = 0;
      let totalCostBasis = 0;
      let realizedPL = 0;

      const transactions = h.transactions || [];
      const chronologicalTxns = [...transactions].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      chronologicalTxns.forEach((t: any) => {
        const qty = Number(t.quantity);
        const price = Number(t.price);
        if (t.type === 'BUY') {
          totalQty += qty;
          totalCostBasis += (qty * price);
        } else if (t.type === 'SELL') {
          const currentAvgCost = totalQty > 0 ? (totalCostBasis / totalQty) : 0;
          const costOfSoldShares = currentAvgCost * qty;
          const saleProceeds = qty * price;
          
          realizedPL += (saleProceeds - costOfSoldShares);
          
          totalQty -= qty;
          totalCostBasis = totalQty <= 0 ? 0 : totalCostBasis - costOfSoldShares;
        } else if (t.type === 'SET_AVG_PRICE') {
          totalCostBasis = totalQty * price;
        }
      });

      const avgBuyPrice = totalQty > 0 ? (totalCostBasis / totalQty) : 0;

      return {
        ...h,
        quantity: totalQty,
        avgBuyPrice,
        realizedPL,
        transactions: transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    }).filter((h: any) => h.transactions.length > 0);

    const symbols = holdings.map((h: any) => h.symbol);
    
    const quotes = await yahooFinance.quote(symbols);
    
    const quotesMap: Record<string, any> = {};
    if (Array.isArray(quotes)) {
      (quotes as any[]).forEach((q: any) => quotesMap[q.symbol] = q);
    } else if (quotes) {
      quotesMap[(quotes as any).symbol] = quotes;
    }

    const enrichedHoldings = await Promise.all(holdings.map(async (holding: any) => {
      const q = quotesMap[holding.symbol];
      const currentPrice = q?.regularMarketPrice || holding.avgBuyPrice; 
      const name = q?.longName || q?.shortName || holding.symbol;
      
      let sector = "Unknown";
      let industry = "Unknown";
      let explanation = "";
      let yieldPct = 0;
      let exDividendDate = null;
      let dividendDate = null;
      
      try {
        const summary = (await yahooFinance.quoteSummary(holding.symbol, { modules: ['assetProfile', 'summaryDetail', 'calendarEvents'] })) as any;
        sector = summary.assetProfile?.sector || "Unknown";
        industry = summary.assetProfile?.industry || "Unknown";
        explanation = summary.assetProfile?.longBusinessSummary || "";
        yieldPct = summary.summaryDetail?.dividendYield ? summary.summaryDetail.dividendYield * 100 : 0;
        exDividendDate = summary.summaryDetail?.exDividendDate || summary.calendarEvents?.exDividendDate || null;
        dividendDate = summary.calendarEvents?.dividendDate || null;
      } catch (e) {
        console.log(`Failed fetching assetProfile for ${holding.symbol}`);
      }
      
      const marketValue = currentPrice * holding.quantity;
      const costBasis = holding.avgBuyPrice * holding.quantity;
      const unrealizedPL = marketValue - costBasis;
      const unrealizedPLPercent = costBasis !== 0 ? (unrealizedPL / costBasis) * 100 : 0;
      
      const dailyChange = q?.regularMarketChange || 0;
      const dailyChangePct = q?.regularMarketChangePercent || 0;
      
      return {
        ...holding,
        name,
        currentPrice,
        currency: q?.currency || 'USD',
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
        dailyChange,
        dailyChangePct,
        sector,
        industry,
        explanation,
        yieldPct,
        exDividendDate,
        dividendDate,
        marketDate: q?.regularMarketTime || null,
      };
    }));

    return NextResponse.json({ holdings: enrichedHoldings });
  } catch (error: any) {
    console.error('Error in GET /api/portfolio:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio data: ' + error.message }, { status: 500 });
  }
}

// POST: Add new holding, add transaction, or delete transaction
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await request.json();
    const { action, symbol, type, quantity, price, date, transactionId } = body;
    
    if (action === 'deleteTransaction') {
      if (transactionId) {
        await prisma.transaction.deleteMany({
          where: { id: transactionId, userId }
        });
      }
    } else if (action === 'editTransaction') {
      if (transactionId) {
        await prisma.transaction.updateMany({
          where: { id: transactionId, userId },
          data: {
            type: type || 'BUY',
            quantity: Number(quantity),
            avgBuyPrice: Number(price),
            date: date
          }
        });
      }
    } else {
      if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
      }
      
      await prisma.transaction.create({
        data: {
          userId,
          symbol: symbol.toUpperCase(),
          type: type || 'BUY',
          quantity: Number(quantity),
          avgBuyPrice: Number(price),
          date: date || new Date().toISOString().split('T')[0]
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/portfolio:', error);
    return NextResponse.json({ error: 'Failed to save transaction: ' + error.message }, { status: 500 });
  }
}
