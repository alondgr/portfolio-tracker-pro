const yf = require('yahoo-finance2').default;
console.log('yf type:', typeof yf);
console.log('yf keys:', Object.keys(yf));
if (yf.YahooFinance) console.log('yf.YahooFinance exists');
