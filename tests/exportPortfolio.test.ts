import test from 'node:test';
import assert from 'node:assert';
import { buildHoldingsRows } from '../src/lib/exportPortfolio';

test('buildHoldingsRows formats holdings and summary rows in selected currency', () => {
  const result = buildHoldingsRows({
    holdings: [
      {
        symbol: 'NVDA',
        quantity: 10,
        avgBuyPrice: 100,
        currentPrice: 150,
        marketValue: 1500,
        dailyChange: 5,
        dailyChangePct: 3.45,
        unrealizedPL: 500,
        unrealizedPLPercent: 50,
        yieldPct: 0.03,
        totalDividendsReceived: 4,
        currency: 'USD',
        sector: 'Technology',
        industry: 'Semiconductors',
      },
    ],
    watchlist: [],
    aiResults: [{ symbol: 'NVDA', garpScore: 85, moatScore: 92, valueScore: 70 }],
    selectedCurrency: 'USD',
    convertValue: (v) => v,
    totalMarketValue: 1500,
    totalCostBasis: 1000,
    totalUnrealizedPL: 500,
    totalPortfolioDividends: 4,
    totalDailyChange: 50,
    avgYield: 0.03,
  });

  assert.strictEqual(result.rows.length, 1);
  assert.strictEqual(result.rows[0][0], 'NVDA');
  assert.strictEqual(result.rows[0][5], 1500);
  assert.strictEqual(result.rows[0][12], 85);
  assert.strictEqual(result.summaryRow[0], 'TOTAL / PORTFOLIO SUMMARY');
  assert.strictEqual(result.summaryRow[5], 1500);
});
