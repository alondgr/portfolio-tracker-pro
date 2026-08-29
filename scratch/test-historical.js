const yfModule = require('yahoo-finance2').default || require('yahoo-finance2');
const yf = new (yfModule.YahooFinance || yfModule)();

async function run() {
  try {
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 1);
    
    console.log("Fetching historical for AAPL...");
    const result = await yf.historical('AAPL', {
      period1: minDate,
      period2: today,
      interval: '1d'
    });
    console.log("Result length:", result.length);
    if (result.length > 0) {
      console.log("First item:", result[0]);
    }
  } catch (error) {
    console.error("Error fetching historical:", error);
  }
}
run();
