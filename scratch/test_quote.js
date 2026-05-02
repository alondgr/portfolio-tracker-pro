const yf = require('yahoo-finance2').default;

async function test() {
  try {
    const yahooFinance = new (yf.YahooFinance || yf)();
    const symbol = 'AAPL';
    console.log(`Fetching quote for ${symbol}...`);
    const quote = await yahooFinance.quote(symbol);
    console.log('Quote:', quote.regularMarketPrice);
  } catch (e) {
    console.error('Quote failed:', e);
  }
}

test();
