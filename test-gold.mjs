import yf from 'yahoo-finance2';

async function run() {
  const symbol = 'GOLD';
  const yahooFinance = new (yf.YahooFinance || yf)();
  
  const summary = await yahooFinance.quoteSummary(symbol, { 
    modules: ['financialData', 'defaultKeyStatistics', 'assetProfile', 'price', 'summaryDetail'] 
  }) as any;

  const financialData = summary.financialData || {};
  const keyStats = summary.defaultKeyStatistics || {};
  const profile = summary.assetProfile || {};
  const price = summary.price || {};
  const summaryDetail = summary.summaryDetail || {};

  let score = 50; // GARP base score
  
  const currentPrice = financialData.currentPrice || price.regularMarketPrice || 0;
  const targetPrice = financialData.targetMeanPrice || 0;
  let upsidePct = 0;
  if (currentPrice > 0 && targetPrice > currentPrice) {
    upsidePct = (targetPrice - currentPrice) / currentPrice;
  }

  // GARP SCORING
  if (financialData.operatingMargins > 0.2) score += 10;
  else if (financialData.operatingMargins > 0.1) score += 5;

  if (financialData.returnOnEquity > 0.15) score += 10;

  const forwardPE = keyStats.forwardPE || financialData.forwardPE;
  if (forwardPE > 0 && forwardPE < 15) score += 10;
  else if (forwardPE >= 15 && forwardPE < 25) score += 5;
  else if (forwardPE > 40) score -= 10;

  const revenueGrowth = financialData.revenueGrowth;
  if (revenueGrowth > 0.15) score += 15;
  else if (revenueGrowth > 0.05) score += 5;

  const recommendation = financialData.recommendationMean;
  if (recommendation) {
    if (recommendation <= 2.0) score += 10;
    else if (recommendation >= 3.5) score -= 10;
  }

  const sector = profile.sector;
  if (sector === 'Technology' || sector === 'Healthcare') score += 5;

  const garpScore = Math.min(Math.max(score, 10), 99);

  // MOAT SCORING
  let moatScore = 50;
  const fcf = financialData.freeCashflow || 0;
  const marketCap = price.marketCap || summaryDetail.marketCap || 0;
  if (fcf > 0 && marketCap > 0) {
    const fcfYield = fcf / marketCap;
    if (fcfYield > 0.05) moatScore += 15;
    else if (fcfYield > 0.02) moatScore += 5;
  }
  const grossMargin = financialData.grossMargins || 0;
  if (grossMargin > 0.5) moatScore += 10;
  else if (grossMargin > 0.3) moatScore += 5;

  const currentRatio = financialData.currentRatio || 0;
  if (currentRatio > 2.0) moatScore += 10;
  else if (currentRatio < 1.0) moatScore -= 10;

  const ebitdaMargins = financialData.ebitdaMargins || 0;
  if (ebitdaMargins > 0.25) moatScore += 10;

  const returnOnAssets = financialData.returnOnAssets || 0;
  if (returnOnAssets > 0.1) moatScore += 5;

  const finalMoatScore = Math.min(Math.max(moatScore, 10), 99);

  // VALUE SCORING
  let valueScore = 50;
  const priceToBook = keyStats.priceToBook || 0;
  if (priceToBook > 0) {
    if (priceToBook < 1.0) valueScore += 20;
    else if (priceToBook < 1.5) valueScore += 10;
    else if (priceToBook > 5.0) valueScore -= 10;
  }

  const evToEbitda = keyStats.enterpriseToEbitda || 0;
  if (evToEbitda > 0) {
    if (evToEbitda < 8) valueScore += 15;
    else if (evToEbitda < 12) valueScore += 5;
    else if (evToEbitda > 25) valueScore -= 10;
  }

  const priceToSales = summaryDetail.priceToSalesTrailing12Months || keyStats.priceToSalesTrailing12Months || 0;
  if (priceToSales > 0) {
    if (priceToSales < 2) valueScore += 15;
    else if (priceToSales > 10) valueScore -= 10;
  }
  
  const divYield = summaryDetail.dividendYield || 0;
  if (divYield > 0.04) valueScore += 10;

  const finalValueScore = Math.min(Math.max(valueScore, 10), 99);

  console.log({
    symbol,
    garpScore,
    moatScore: finalMoatScore,
    valueScore: finalValueScore,
  });
}

run();
