const yf = require('yahoo-finance2');
const YahooFinance = yf.YahooFinance || yf.default?.YahooFinance || yf.default || yf;
try {
  const yahooFinance = new YahooFinance();
  console.log('Successfully initialized YahooFinance');
  yahooFinance.quote('AAPL')
    .then(q => console.log('Successfully fetched quote for AAPL'))
    .catch(e => console.error('Failed to fetch quote:', e.message));
} catch (e) {
  console.error('Failed to initialize YahooFinance:', e.message);
}
