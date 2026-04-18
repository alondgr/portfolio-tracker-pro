import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
const HOLDINGS_PATH = path.join(process.cwd(), 'data', 'holdings.json');

// Helper to reliably read our holdings file
async function getHoldings() {
  try {
    const fileContents = await fs.readFile(HOLDINGS_PATH, 'utf8');
    const data = JSON.parse(fileContents);
    return data.holdings || [];
  } catch (error) {
    console.error('Error reading holdings:', error);
    return [];
  }
}

// GET: Fetch our holdings, compute aggregate values from transactions, and get real-time quotes
export async function GET() {
  try {
    const rawHoldings = await getHoldings();
    
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
          // Floor the cost basis to 0 if quantity falls to or below 0 to avoid floating point anomalies
          totalCostBasis = totalQty <= 0 ? 0 : totalCostBasis - costOfSoldShares;
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
      let yieldPct = 0;
      
      try {
        const summary = (await yahooFinance.quoteSummary(holding.symbol, { modules: ['assetProfile', 'summaryDetail'] })) as any;
        sector = summary.assetProfile?.sector || "Unknown";
        industry = summary.assetProfile?.industry || "Unknown";
        yieldPct = summary.summaryDetail?.dividendYield ? summary.summaryDetail.dividendYield * 100 : 0;
      } catch (e) {
        console.log(`Failed fetching assetProfile for ${holding.symbol}`);
      }
      
      const marketValue = currentPrice * holding.quantity;
      const costBasis = holding.avgBuyPrice * holding.quantity;
      const unrealizedPL = marketValue - costBasis;
      const unrealizedPLPercent = costBasis !== 0 ? (unrealizedPL / costBasis) * 100 : 0;
      
      return {
        ...holding,
        name,
        currentPrice,
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
        yieldPct,
        sector,
        industry,
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
    const body = await request.json();
    const { action, symbol, type, quantity, price, date, transactionId } = body;
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    let holdings = await getHoldings();
    const upperSymbol = symbol.toUpperCase();
    
    const existingIndex = holdings.findIndex((h: any) => h.symbol === upperSymbol);
    
    if (action === 'deleteTransaction') {
      if (existingIndex >= 0 && transactionId) {
        holdings[existingIndex].transactions = holdings[existingIndex].transactions.filter((t: any) => t.id !== transactionId);
      }
    } else if (action === 'editTransaction') {
      if (existingIndex >= 0 && transactionId) {
        const tIndex = holdings[existingIndex].transactions.findIndex((t: any) => t.id === transactionId);
        if (tIndex >= 0) {
          holdings[existingIndex].transactions[tIndex] = {
            ...holdings[existingIndex].transactions[tIndex],
            type: type || holdings[existingIndex].transactions[tIndex].type,
            date: date || holdings[existingIndex].transactions[tIndex].date,
            quantity: Number(quantity),
            price: Number(price)
          };
        }
      }
    } else {
      // It's either 'addTransaction' or a fresh holding add
      const newTransaction = {
        id: Date.now().toString() + Math.random().toString().slice(2, 6),
        type: type || 'BUY',
        date: date || new Date().toISOString().split('T')[0],
        quantity: Number(quantity),
        price: Number(price)
      };

      if (existingIndex >= 0) {
        if (!holdings[existingIndex].transactions) {
          holdings[existingIndex].transactions = [];
        }
        holdings[existingIndex].transactions.push(newTransaction);
      } else {
        holdings.push({
          symbol: upperSymbol,
          transactions: [newTransaction]
        });
      }
    }

    await fs.writeFile(HOLDINGS_PATH, JSON.stringify({ holdings }, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/portfolio:', error);
    return NextResponse.json({ error: 'Failed to save transaction: ' + error.message }, { status: 500 });
  }
}
