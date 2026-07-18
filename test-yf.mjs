import yf from 'yahoo-finance2';
const yahooFinance = new yf.YahooFinance();
async function run() {
  const b = await yahooFinance.quote('B');
  console.log('Ticker B:', b.shortName, b.longName);
  const search = await yahooFinance.search('BARRICK');
  console.log('Search Barrick:', search.quotes.slice(0, 3).map(q => q.symbol));
}
run();
