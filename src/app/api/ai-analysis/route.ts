import { NextResponse } from 'next/server';
import yf from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const yahooFinance = new (yf.YahooFinance || yf)();
    
    const analysisResults = [];

    for (const symbol of symbols) {
      try {
        const summary = await yahooFinance.quoteSummary(symbol, { 
          modules: ['financialData', 'defaultKeyStatistics', 'assetProfile', 'price'] 
        }) as any;

        const financialData = summary.financialData || {};
        const keyStats = summary.defaultKeyStatistics || {};
        const profile = summary.assetProfile || {};
        const price = summary.price || {};

        let score = 50; // Base score
        let reasons = [];
        
        const currentPrice = financialData.currentPrice || price.regularMarketPrice || 0;
        const targetPrice = financialData.targetMeanPrice || 0;
        let upsidePct = 0;
        if (currentPrice > 0 && targetPrice > currentPrice) {
          upsidePct = (targetPrice - currentPrice) / currentPrice;
        }

        // Profitability (Long term survival)
        if (financialData.operatingMargins > 0.2) {
          score += 10;
          reasons.push("Exceptional operating margins (>20%) indicating strong pricing power.");
        } else if (financialData.operatingMargins > 0.1) {
          score += 5;
        }

        if (financialData.returnOnEquity > 0.15) {
          score += 10;
          reasons.push("High Return on Equity (>15%) shows efficient capital use.");
        }

        // Valuation
        const forwardPE = keyStats.forwardPE || financialData.forwardPE;
        if (forwardPE > 0 && forwardPE < 15) {
          score += 10;
          reasons.push("Attractive valuation with Forward P/E under 15.");
        } else if (forwardPE >= 15 && forwardPE < 25) {
          score += 5;
        } else if (forwardPE > 40) {
          score -= 10;
          reasons.push("High valuation multiples present long-term multiple compression risk.");
        }

        // Growth
        const revenueGrowth = financialData.revenueGrowth;
        if (revenueGrowth > 0.15) {
          score += 15;
          reasons.push("Strong revenue growth (>15%) supporting long-term expansion.");
        } else if (revenueGrowth > 0.05) {
          score += 5;
        }

        // Analyst sentiment as a proxy for institutional backing
        const recommendation = financialData.recommendationMean;
        if (recommendation) {
          if (recommendation <= 2.0) {
            score += 10;
            reasons.push("Strong institutional buy consensus.");
          } else if (recommendation >= 3.5) {
            score -= 10;
          }
        }

        // Sector tailwinds (AI / Tech / Healthcare bias for "5 years")
        const sector = profile.sector;
        if (sector === 'Technology' || sector === 'Healthcare') {
          score += 5;
          reasons.push(`Sector tailwinds in ${sector} favor 5-year outperformance.`);
        }

        analysisResults.push({
          symbol,
          score: Math.min(Math.max(score, 10), 99), // clamp between 10 and 99
          reasons: reasons.slice(0, 2), // Keep top 2 reasons
          upsidePct,
        });
        
      } catch (e) {
        console.error(`Failed to analyze ${symbol}:`, e);
        // Fallback score if we can't get data (e.g. for crypto or ETFs)
        analysisResults.push({
          symbol,
          score: 50,
          reasons: ["Insufficient deep financial data for full 5-year analysis."],
          upsidePct: 0
        });
      }
    }

    // Sort by score descending, then by upside potential descending
    analysisResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (b.upsidePct || 0) - (a.upsidePct || 0);
    });

    return NextResponse.json({ results: analysisResults });

  } catch (error: any) {
    console.error('Error in AI Analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
