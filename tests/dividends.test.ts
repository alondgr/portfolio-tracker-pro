import test from 'node:test';
import assert from 'node:assert';
import { calculateDividends, Transaction, DividendEvent } from '../src/lib/dividends';

test('calculateDividends calculates correct payout based on transaction dates', () => {
  const transactions: Transaction[] = [
    { type: 'BUY', quantity: 10, date: new Date('2023-01-01') },
    { type: 'BUY', quantity: 5, date: new Date('2023-05-15') },
    { type: 'SELL', quantity: 2, date: new Date('2023-08-01') }
  ];

  const dividendEvents: DividendEvent[] = [
    { date: new Date('2023-02-01'), amount: 1.5 }, // 10 shares owned -> 15
    { date: new Date('2023-06-01'), amount: 1.5 }, // 15 shares owned -> 22.5
    { date: new Date('2023-09-01'), amount: 1.5 }  // 13 shares owned -> 19.5
  ];

  const { totalDividendsReceived, dividendHistory } = calculateDividends(
    transactions,
    dividendEvents,
    'AAPL',
    'USD'
  );

  assert.strictEqual(totalDividendsReceived, 15 + 22.5 + 19.5);
  assert.strictEqual(dividendHistory.length, 3);
  assert.strictEqual(dividendHistory[0].shares, 10);
  assert.strictEqual(dividendHistory[1].shares, 15);
  assert.strictEqual(dividendHistory[2].shares, 13);
  
  // Test same day purchase (should not receive dividend if bought ON ex-dividend date)
  const sameDayTransactions: Transaction[] = [
    { type: 'BUY', quantity: 10, date: new Date('2023-02-01') }
  ];
  const sameDayResult = calculateDividends(sameDayTransactions, dividendEvents, 'AAPL', 'USD');
  assert.strictEqual(sameDayResult.totalDividendsReceived, 30, 'Should not receive dividend on the purchase date, but should for future dates');
  assert.strictEqual(sameDayResult.dividendHistory.length, 2, 'Should only have 2 dividend events recorded');
});
