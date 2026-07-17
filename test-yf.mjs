import yf from 'yahoo-finance2';
const yahooFinance = new (yf.YahooFinance || yf)();
yahooFinance.quoteSummary('B', { modules: ['financialData', 'defaultKeyStatistics', 'assetProfile', 'price', 'summaryDetail'] }).then(res => {
  console.log(JSON.stringify({
    operatingMargins: res.financialData?.operatingMargins,
    returnOnEquity: res.financialData?.returnOnEquity,
    forwardPE: res.defaultKeyStatistics?.forwardPE || res.financialData?.forwardPE,
    revenueGrowth: res.financialData?.revenueGrowth,
    recommendation: res.financialData?.recommendationMean,
    sector: res.assetProfile?.sector,
    fcf: res.financialData?.freeCashflow || res.defaultKeyStatistics?.freeCashflow,
    marketCap: res.price?.marketCap,
    debtToEquity: res.financialData?.debtToEquity,
    roa: res.financialData?.returnOnAssets,
    beta: res.defaultKeyStatistics?.beta,
    priceToBook: res.defaultKeyStatistics?.priceToBook,
    evToEbitda: res.defaultKeyStatistics?.enterpriseToEbitda,
    priceToSales: res.summaryDetail?.priceToSalesTrailing12Months,
    divYield: res.summaryDetail?.dividendYield
  }, null, 2));
}).catch(err => console.log(err));
