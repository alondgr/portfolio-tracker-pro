const yfModule = require('yahoo-finance2').default || require('yahoo-finance2');
const yf = new (yfModule.YahooFinance || yfModule)();

async function run() {
  try {
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 1);
    
    console.log("Fetching chart for AAPL...");
    const result = await yf.chart('AAPL', {
      period1: minDate,
      period2: today,
      interval: '1d'
    });
    console.log("Result keys:", Object.keys(result));
    console.log("Quotes length:", result.quotes.length);
    if (result.quotes.length > 0) {
      console.log("First quote:", result.quotes[0]);
    }
  } catch (error) {
    console.error("Error fetching chart:", error);
  }
}
run();
