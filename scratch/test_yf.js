// Node 16 doesn't have fetch, so we use a mock or polyfill if needed
// But for this test, we just want to see if the library works with a better environment
const yf = require('yahoo-finance2').default;

async function test() {
  try {
    const yahooFinance = new (yf.YahooFinance || yf)();
    const symbol = 'AAPL';
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 1);
    
    console.log(`Fetching historical for ${symbol}...`);
    
    // In some environments, we might need to manually set a fetcher if the global one is missing
    // But let's see if providing period2 fixed the options error.
    const result = await yahooFinance.historical(symbol, {
      period1: minDate,
      period2: new Date(),
      interval: '1d'
    });
    
    console.log(`Result length: ${result.length}`);
    if (result.length > 0) {
      console.log('First entry:', result[0]);
    }
  } catch (e) {
    console.error('Test failed:', e.message);
    if (e.errors) console.log('Errors:', JSON.stringify(e.errors, null, 2));
  }
}

test();
