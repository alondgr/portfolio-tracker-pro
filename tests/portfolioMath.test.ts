import test from 'node:test';
import assert from 'node:assert';
import { computeHoldingMetrics } from '../src/lib/portfolioMath';

test('computeHoldingMetrics applies SET_AVG_PRICE after same-day BUY regardless of DB return order', () => {
  // Simulates Postgres returning SET_AVG_PRICE before BUY on the same date (2026-10-16)
  const txns = [
    { type: 'BUY', date: '2026-04-07', quantity: 3, price: 176.71, createdAt: '2026-04-25T11:24:46.440Z' },
    { type: 'BUY', date: '2026-07-16', quantity: 1, price: 208.77, createdAt: '2026-07-16T14:32:12.070Z' },
    { type: 'SET_AVG_PRICE', date: '2026-08-29', quantity: 0, price: 185.29, createdAt: '2026-08-29T13:55:35.881Z' },
    // Same-day override returned BEFORE same-day BUY:
    { type: 'SET_AVG_PRICE', date: '2026-10-16', quantity: 0, price: 191.99, createdAt: '2026-10-16T14:18:02.482Z' },
    { type: 'BUY', date: '2026-10-16', quantity: 1, price: 216.365, createdAt: '2026-10-16T13:46:29.638Z' },
  ];

  const metrics = computeHoldingMetrics(txns);
  assert.strictEqual(metrics.quantity, 5);
  assert.strictEqual(Number(metrics.avgBuyPrice.toFixed(2)), 191.99);
});

test('computeHoldingMetrics applies SET_AVG_PRICE even if created before initial BUY', () => {
  const txns = [
    { type: 'SET_AVG_PRICE', date: '2026-01-01', quantity: 0, price: 120.5 },
    { type: 'BUY', date: '2026-01-02', quantity: 10, price: 150.0 },
  ];

  const metrics = computeHoldingMetrics(txns);
  assert.strictEqual(metrics.quantity, 10);
  assert.strictEqual(metrics.avgBuyPrice, 120.5);
});
