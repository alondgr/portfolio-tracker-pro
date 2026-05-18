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

        let score = 50; // GARP base score
        let reasons = [];
        
        const currentPrice = financialData.currentPrice || price.regularMarketPrice || 0;
        const targetPrice = financialData.targetMeanPrice || 0;
        let upsidePct = 0;
        if (currentPrice > 0 && targetPrice > currentPrice) {
          upsidePct = (targetPrice - currentPrice) / currentPrice;
        }

        // ================= ENGINE 1: GARP SCORING =================
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

        const garpScore = Math.min(Math.max(score, 10), 99);

        // ================= ENGINE 2: MOAT FORTRESS SCORING =================
        let moatScore = 50; // Moat base score
        let moatReasons = [];

        // FCF Yield
        const marketCap = price.marketCap || 0;
        const fcf = financialData.freeCashflow || keyStats.freeCashflow || 0;
        if (marketCap > 0 && fcf > 0) {
          const fcfYield = fcf / marketCap;
          if (fcfYield > 0.08) {
            moatScore += 20;
            moatReasons.push("Exceptional Free Cash Flow yield (>8%) offering a massive cash safety buffer.");
          } else if (fcfYield > 0.05) {
            moatScore += 10;
            moatReasons.push("Strong cash-generative business model.");
          }
        } else if (fcf < 0) {
          moatScore -= 10;
          moatReasons.push("Negative Free Cash Flow indicates operational burn risk.");
        }

        // Debt to Equity
        const debtToEquity = financialData.debtToEquity || 0;
        if (debtToEquity > 0) {
          if (debtToEquity < 50) {
            moatScore += 10;
            moatReasons.push("Highly conservative leverage profile (Debt/Equity < 50%).");
          } else if (debtToEquity < 100) {
            moatScore += 5;
          } else if (debtToEquity > 200) {
            moatScore -= 15;
            moatReasons.push("Elevated debt leverage (>200% D/E ratio) poses interest-rate risk.");
          }
        }

        // Return on Assets (ROA)
        const roa = financialData.returnOnAssets || 0;
        if (roa > 0.15) {
          moatScore += 15;
          moatReasons.push("Superlative Return on Assets (>15%) showing legendary asset efficiency.");
        } else if (roa > 0.08) {
          moatScore += 10;
          moatReasons.push("Healthy operational return efficiency.");
        }

        // Volatility / Beta
        const beta = keyStats.beta || 1.0;
        if (beta < 1.0) {
          moatScore += 10;
          moatReasons.push("Defensive, low-volatility anchor (Beta < 1.0) for market stress.");
        } else if (beta > 1.5) {
          moatScore -= 5;
          moatReasons.push("High stock volatility compared to broader indices.");
        }

        // Valuation - Price to Book
        const priceToBook = keyStats.priceToBook || 0;
        if (priceToBook > 0) {
          if (priceToBook < 3.0) {
            moatScore += 10;
            moatReasons.push("Highly attractive tangible asset valuation (P/B under 3.0).");
          } else if (priceToBook > 12.0) {
            moatScore -= 10;
            moatReasons.push("Extreme valuation premium on book assets (>12x Price/Book).");
          }
        }

        const finalMoatScore = Math.min(Math.max(moatScore, 10), 99);

        analysisResults.push({
          symbol,
          garpScore,
          moatScore: finalMoatScore,
          garpReasons: reasons.slice(0, 2),
          moatReasons: moatReasons.slice(0, 2),
          upsidePct,
        });
        
      } catch (e) {
        console.error(`Failed to analyze ${symbol}:`, e);
        analysisResults.push({
          symbol,
          garpScore: 50,
          moatScore: 50,
          garpReasons: ["Insufficient financial data for growth analysis."],
          moatReasons: ["Insufficient asset data for moat analysis."],
          upsidePct: 0
        });
      }
    }

    // Sort by combined dynamic value or garpScore by default
    analysisResults.sort((a, b) => {
      const avgA = (a.garpScore + a.moatScore) / 2;
      const avgB = (b.garpScore + b.moatScore) / 2;
      if (avgB !== avgA) {
        return avgB - avgA;
      }
      return (b.upsidePct || 0) - (a.upsidePct || 0);
    });

    return NextResponse.json({ results: analysisResults });

  } catch (error: any) {
    console.error('Error in AI Analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
