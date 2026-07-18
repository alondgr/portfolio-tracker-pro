import { NextResponse } from 'next/server';
import yf from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

const CURATED_POOL = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'BRK-B', 'LLY', 'AVGO', 
  'JPM', 'UNH', 'V', 'XOM', 'MA', 'JNJ', 'PG', 'HD', 'COST', 'MRK', 
  'ABBV', 'CRM', 'AMD', 'CVX', 'WMT', 'KO', 'PEP', 'BAC', 'TMO', 'NFLX', 
  'DIS', 'MCD', 'ADBE', 'ORCL', 'CSCO', 'ACN', 'ABT', 'PFE', 'LIN', 'INTC', 
  'QCOM', 'DHR', 'TXN', 'INTU', 'IBM', 'COP', 'AMGN', 'NKE', 'CAT', 'GE',
  'ISRG', 'SPGI', 'NOW', 'HON', 'BA', 'SYK', 'BLK', 'UNP', 'PLD', 'BKNG', 'DE',
  'GS', 'MMM', 'C', 'RTX', 'LMT', 'MDT', 'T', 'VZ', 'ZTS', 'MO', 'PM',
  'GILD', 'CVS', 'CI', 'BDX', 'TJX', 'SBUX', 'NEM', 'GOLD', 'FCX', 'OXY'
];

export async function POST(request: Request) {
  try {
    const yahooFinance = new (yf.YahooFinance || yf)();
    
    // Select 15 random stocks from the pool to scan to prevent rate limits
    const shuffled = [...CURATED_POOL].sort(() => 0.5 - Math.random());
    const symbolsToScan = shuffled.slice(0, 15);

    const scanPromises = symbolsToScan.map(async (symbol) => {
      try {
        const summary = await yahooFinance.quoteSummary(symbol, { 
          modules: ['financialData', 'defaultKeyStatistics', 'assetProfile', 'price'] 
        }) as any;

        const profile = summary.assetProfile || {};
        const price = summary.price || {};
        const financialData = summary.financialData || {};
        const keyStats = summary.defaultKeyStatistics || {};

        let garpScore = 50; 
        
        // GARP
        if (financialData.operatingMargins > 0.2) garpScore += 10;
        else if (financialData.operatingMargins > 0.1) garpScore += 5;
        if (financialData.returnOnEquity > 0.15) garpScore += 10;
        
        const forwardPE = keyStats.forwardPE || financialData.forwardPE;
        if (forwardPE > 0 && forwardPE < 15) garpScore += 10;
        else if (forwardPE >= 15 && forwardPE < 25) garpScore += 5;
        else if (forwardPE > 40) garpScore -= 10;
        
        const revenueGrowth = financialData.revenueGrowth;
        if (revenueGrowth > 0.15) garpScore += 15;
        else if (revenueGrowth > 0.05) garpScore += 5;
        
        const recommendation = financialData.recommendationMean;
        if (recommendation) {
          if (recommendation <= 2.0) garpScore += 10;
          else if (recommendation >= 3.5) garpScore -= 10;
        }
        
        const sector = profile.sector;
        if (sector === 'Technology' || sector === 'Healthcare') garpScore += 5;

        garpScore = Math.min(Math.max(garpScore, 10), 99);

        // MOAT
        let moatScore = 50;
        const marketCap = price.marketCap || 0;
        const fcf = financialData.freeCashflow || keyStats.freeCashflow || 0;
        if (marketCap > 0 && fcf > 0) {
          const fcfYield = fcf / marketCap;
          if (fcfYield > 0.08) moatScore += 20;
          else if (fcfYield > 0.05) moatScore += 10;
        } else if (fcf < 0) moatScore -= 10;

        const debtToEquity = financialData.debtToEquity || 0;
        if (debtToEquity > 0) {
          if (debtToEquity < 50) moatScore += 10;
          else if (debtToEquity < 100) moatScore += 5;
          else if (debtToEquity > 200) moatScore -= 15;
        }

        const roa = financialData.returnOnAssets || 0;
        if (roa > 0.15) moatScore += 15;
        else if (roa > 0.08) moatScore += 10;

        const beta = keyStats.beta || 1.0;
        if (beta < 1.0) moatScore += 10;
        else if (beta > 1.5) moatScore -= 5;

        const priceToBook = keyStats.priceToBook || 0;
        if (priceToBook > 0) {
          if (priceToBook < 3.0) moatScore += 10;
          else if (priceToBook > 12.0) moatScore -= 10;
        }

        moatScore = Math.min(Math.max(moatScore, 10), 99);

        // VALUE
        let valueScore = 50;
        if (priceToBook > 0) {
          if (priceToBook < 1.5) valueScore += 20;
          else if (priceToBook < 3.0) valueScore += 10;
          else if (priceToBook > 10.0) valueScore -= 10;
        }

        const evToEbitda = keyStats.enterpriseToEbitda || 0;
        if (evToEbitda > 0) {
          if (evToEbitda < 8) valueScore += 15;
          else if (evToEbitda < 12) valueScore += 5;
          else if (evToEbitda > 25) valueScore -= 10;
        }

        const priceToSales = keyStats.priceToSalesTrailing12Months || 0;
        if (priceToSales > 0) {
          if (priceToSales < 2) valueScore += 15;
          else if (priceToSales > 10) valueScore -= 10;
        }

        valueScore = Math.min(Math.max(valueScore, 10), 99);

        const isTrinity = garpScore >= 75 && moatScore >= 75 && valueScore >= 75;
        const isConfluence = !isTrinity && [garpScore, moatScore, valueScore].filter(s => s >= 75).length >= 2;

        if (isTrinity || isConfluence) {
          return {
            symbol,
            name: price.longName || price.shortName || symbol,
            garpScore,
            moatScore,
            valueScore,
            isTrinity,
            isConfluence,
            sector
          };
        }
        return null;
      } catch (e) {
        return null; // Skip on error
      }
    });

    const results = await Promise.all(scanPromises);
    const discovered = results.filter(r => r !== null);

    return NextResponse.json({ results: discovered });

  } catch (error: any) {
    console.error('Error in Trinity Screener:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
