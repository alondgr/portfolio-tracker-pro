import { NextResponse } from 'next/server';
import yf from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedTopMarketCap: { timestamp: number; results: any[] } | null = null;

// Comprehensive deduplicated pool of the 250 largest US & global companies listed in USD on NYSE / NASDAQ.
// Single share-class per issuer (e.g. GOOGL only, BRK-B only) to prevent duplicate company entries.
const MEGACAP_POOL = Array.from(new Set([
  'AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSM', 'BRK-B', 'AVGO', 'TSLA',
  'LLY', 'WMT', 'JPM', 'V', 'XOM', 'ORCL', 'MA', 'UNH', 'NFLX', 'COST',
  'JNJ', 'PG', 'HD', 'ABBV', 'BAC', 'SAP', 'ASML', 'CRM', 'AMD', 'CVX',
  'KO', 'TMUS', 'WFC', 'CSCO', 'ACN', 'MRK', 'NOW', 'AXP', 'LIN', 'PEP',
  'IBM', 'MCD', 'GE', 'ISRG', 'CAT', 'TMO', 'DIS', 'ABT', 'PM', 'GS',
  'TXN', 'QCOM', 'INTU', 'VZ', 'AMGN', 'BKNG', 'T', 'PLTR', 'SPGI', 'BLK',
  'NEE', 'PFE', 'SYK', 'DHR', 'LOW', 'HON', 'UNP', 'RTX', 'UBER', 'ETN',
  'AMAT', 'C', 'CMCSA', 'COP', 'SCHW', 'PGR', 'ADP', 'BSX', 'TJX', 'BA',
  'PANW', 'LMT', 'VRTX', 'GILD', 'DE', 'MU', 'BMY', 'CB', 'SBUX', 'ADI',
  'MDT', 'PLD', 'MMC', 'FI', 'NKE', 'KKR', 'ANET', 'LRCX', 'KLAC', 'CRWD',
  'MELI', 'SPOT', 'SNPS', 'CDNS', 'ICE', 'SHW', 'SO', 'MO', 'CEG', 'DUK',
  'PH', 'WM', 'WELL', 'CME', 'MCK', 'MCO', 'APH', 'CTAS', 'MSI', 'EQIX',
  'ITW', 'REGN', 'CL', 'ZTS', 'TDG', 'PYPL', 'EOG', 'CVS', 'ORLY', 'GD',
  'NOC', 'SLB', 'USB', 'PNC', 'AON', 'EMR', 'TGT', 'MAR', 'FDX', 'CSX',
  'FCX', 'NEM', 'GOLD', 'OXY', 'MSTR', 'COIN', 'DELL', 'ABNB', 'DASH', 'SNOW',
  'APP', 'TEAM', 'WDAY', 'FTNT', 'MRVL', 'INTC', 'BABA', 'PDD', 'ARM', 'SHOP',
  'NVS', 'AZN', 'SHEL', 'HSBC', 'TM', 'NVO', 'UL', 'SONY', 'TTE', 'RY',
  'TD', 'SAN', 'UBS', 'RIO', 'BHP', 'SNY', 'BTI', 'RELX', 'MUFG', 'HDB',
  'MS', 'GEV', 'BUD', 'BX', 'SMFG', 'IBKR', 'COF', 'APO', 'BN', 'HCA',
  'SE', 'CPNG', 'NU', 'NTES', 'JD', 'TCOM', 'IBN', 'INFY', 'CNQ', 'ENB',
  'BMO', 'BNS', 'CP', 'CNR', 'TRI', 'RACE', 'STLA', 'FERG', 'CRH', 'NGG',
  'GSK', 'BP', 'DEO', 'ING', 'BBVA', 'ITUB', 'PBR', 'VALE', 'ABEV', 'SCCO',
  'VST', 'TRGP', 'WMB', 'OKE', 'KMI', 'MPC', 'PSX', 'VLO', 'HLT', 'RCL',
  'CMG', 'YUM', 'AZO', 'ROST', 'FAST', 'CPRT', 'URI', 'PWR', 'GWW', 'TT',
  'CARR', 'OTIS', 'HWM', 'AXON', 'FICO', 'ROP', 'ADSK', 'DDOG', 'NET', 'ZS'
]));

const SECTOR_MAP: Record<string, string> = {
  // Technology
  AAPL: 'Technology', NVDA: 'Technology', MSFT: 'Technology', TSM: 'Technology', AVGO: 'Technology',
  ORCL: 'Technology', SAP: 'Technology', ASML: 'Technology', CRM: 'Technology', AMD: 'Technology',
  CSCO: 'Technology', ACN: 'Technology', NOW: 'Technology', IBM: 'Technology', TXN: 'Technology',
  QCOM: 'Technology', INTU: 'Technology', PLTR: 'Technology', UBER: 'Technology', AMAT: 'Technology',
  ADP: 'Technology', PANW: 'Technology', MU: 'Technology', ADI: 'Technology', FI: 'Technology',
  ANET: 'Technology', LRCX: 'Technology', KLAC: 'Technology', CRWD: 'Technology', SNPS: 'Technology',
  CDNS: 'Technology', APH: 'Technology', MSI: 'Technology', MSTR: 'Technology', DELL: 'Technology',
  SNOW: 'Technology', APP: 'Technology', TEAM: 'Technology', WDAY: 'Technology', FTNT: 'Technology',
  MRVL: 'Technology', INTC: 'Technology', ARM: 'Technology', SHOP: 'Technology', SONY: 'Technology',
  INFY: 'Technology', TRI: 'Technology', FICO: 'Technology', ROP: 'Technology', ADSK: 'Technology',
  DDOG: 'Technology', NET: 'Technology', ZS: 'Technology',
  // Communication Services
  GOOGL: 'Communication Services', META: 'Communication Services', NFLX: 'Communication Services',
  TMUS: 'Communication Services', DIS: 'Communication Services', VZ: 'Communication Services',
  T: 'Communication Services', CMCSA: 'Communication Services', SPOT: 'Communication Services',
  NTES: 'Communication Services',
  // Consumer Cyclical
  AMZN: 'Consumer Cyclical', TSLA: 'Consumer Cyclical', HD: 'Consumer Cyclical', MCD: 'Consumer Cyclical',
  BKNG: 'Consumer Cyclical', LOW: 'Consumer Cyclical', TJX: 'Consumer Cyclical', SBUX: 'Consumer Cyclical',
  NKE: 'Consumer Cyclical', MELI: 'Consumer Cyclical', ORLY: 'Consumer Cyclical', MAR: 'Consumer Cyclical',
  ABNB: 'Consumer Cyclical', DASH: 'Consumer Cyclical', BABA: 'Consumer Cyclical', PDD: 'Consumer Cyclical',
  TM: 'Consumer Cyclical', SE: 'Consumer Cyclical', CPNG: 'Consumer Cyclical', JD: 'Consumer Cyclical',
  TCOM: 'Consumer Cyclical', RACE: 'Consumer Cyclical', STLA: 'Consumer Cyclical', HLT: 'Consumer Cyclical',
  RCL: 'Consumer Cyclical', CMG: 'Consumer Cyclical', YUM: 'Consumer Cyclical', AZO: 'Consumer Cyclical',
  ROST: 'Consumer Cyclical',
  // Consumer Defensive
  WMT: 'Consumer Defensive', COST: 'Consumer Defensive', PG: 'Consumer Defensive', KO: 'Consumer Defensive',
  PEP: 'Consumer Defensive', PM: 'Consumer Defensive', MO: 'Consumer Defensive', CL: 'Consumer Defensive',
  TGT: 'Consumer Defensive', UL: 'Consumer Defensive', BTI: 'Consumer Defensive', BUD: 'Consumer Defensive',
  DEO: 'Consumer Defensive', ABEV: 'Consumer Defensive',
  // Financial Services
  'BRK-B': 'Financial Services', JPM: 'Financial Services', V: 'Financial Services', MA: 'Financial Services',
  BAC: 'Financial Services', WFC: 'Financial Services', AXP: 'Financial Services', GS: 'Financial Services',
  SPGI: 'Financial Services', BLK: 'Financial Services', C: 'Financial Services', SCHW: 'Financial Services',
  PGR: 'Financial Services', CB: 'Financial Services', MMC: 'Financial Services', KKR: 'Financial Services',
  ICE: 'Financial Services', CME: 'Financial Services', MCO: 'Financial Services', PYPL: 'Financial Services',
  USB: 'Financial Services', PNC: 'Financial Services', AON: 'Financial Services', COIN: 'Financial Services',
  HSBC: 'Financial Services', RY: 'Financial Services', TD: 'Financial Services', SAN: 'Financial Services',
  UBS: 'Financial Services', MUFG: 'Financial Services', HDB: 'Financial Services', MS: 'Financial Services',
  BX: 'Financial Services', SMFG: 'Financial Services', IBKR: 'Financial Services', COF: 'Financial Services',
  APO: 'Financial Services', BN: 'Financial Services', NU: 'Financial Services', IBN: 'Financial Services',
  BMO: 'Financial Services', BNS: 'Financial Services', ING: 'Financial Services', BBVA: 'Financial Services',
  ITUB: 'Financial Services',
  // Healthcare
  LLY: 'Healthcare', UNH: 'Healthcare', JNJ: 'Healthcare', ABBV: 'Healthcare', MRK: 'Healthcare',
  ISRG: 'Healthcare', TMO: 'Healthcare', ABT: 'Healthcare', AMGN: 'Healthcare', PFE: 'Healthcare',
  SYK: 'Healthcare', DHR: 'Healthcare', BSX: 'Healthcare', VRTX: 'Healthcare', GILD: 'Healthcare',
  BMY: 'Healthcare', MDT: 'Healthcare', MCK: 'Healthcare', REGN: 'Healthcare', ZTS: 'Healthcare',
  CVS: 'Healthcare', NVS: 'Healthcare', AZN: 'Healthcare', NVO: 'Healthcare', SNY: 'Healthcare',
  HCA: 'Healthcare', GSK: 'Healthcare',
  // Energy
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', EOG: 'Energy', SLB: 'Energy', OXY: 'Energy',
  SHEL: 'Energy', TTE: 'Energy', CNQ: 'Energy', ENB: 'Energy', BP: 'Energy', PBR: 'Energy',
  TRGP: 'Energy', WMB: 'Energy', OKE: 'Energy', KMI: 'Energy', MPC: 'Energy', PSX: 'Energy', VLO: 'Energy',
  // Industrials
  GE: 'Industrials', CAT: 'Industrials', HON: 'Industrials', UNP: 'Industrials', RTX: 'Industrials',
  ETN: 'Industrials', BA: 'Industrials', LMT: 'Industrials', DE: 'Industrials', PH: 'Industrials',
  WM: 'Industrials', CTAS: 'Industrials', ITW: 'Industrials', TDG: 'Industrials', GD: 'Industrials',
  NOC: 'Industrials', EMR: 'Industrials', FDX: 'Industrials', CSX: 'Industrials', RELX: 'Industrials',
  GEV: 'Industrials', CP: 'Industrials', CNR: 'Industrials', FERG: 'Industrials', FAST: 'Industrials',
  CPRT: 'Industrials', URI: 'Industrials', PWR: 'Industrials', GWW: 'Industrials', TT: 'Industrials',
  CARR: 'Industrials', OTIS: 'Industrials', HWM: 'Industrials', AXON: 'Industrials',
  // Basic Materials
  LIN: 'Basic Materials', SHW: 'Basic Materials', FCX: 'Basic Materials', NEM: 'Basic Materials',
  GOLD: 'Basic Materials', RIO: 'Basic Materials', BHP: 'Basic Materials', CRH: 'Basic Materials',
  VALE: 'Basic Materials', SCCO: 'Basic Materials',
  // Utilities
  NEE: 'Utilities', SO: 'Utilities', CEG: 'Utilities', DUK: 'Utilities', NGG: 'Utilities', VST: 'Utilities',
  // Real Estate
  PLD: 'Real Estate', WELL: 'Real Estate', EQIX: 'Real Estate',
};

export async function GET() {
  try {
    if (
      cachedTopMarketCap &&
      cachedTopMarketCap.results.length >= 100 &&
      Date.now() - cachedTopMarketCap.timestamp < CACHE_TTL_MS
    ) {
      return NextResponse.json(
        { results: cachedTopMarketCap.results, cached: true },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' } }
      );
    }

    const yahooFinance = new (yf.YahooFinance || yf)({ suppressNotices: ['yahooSurvey'] });
    try {
      if (yahooFinance.suppressNotices) {
        yahooFinance.suppressNotices(['*']);
      }
    } catch (e) {
      // Ignore
    }

    // Fetch in parallel chunks of 65 symbols for fast, reliable Yahoo Finance batch responses
    const chunkSize = 65;
    const chunks: string[][] = [];
    for (let i = 0; i < MEGACAP_POOL.length; i += chunkSize) {
      chunks.push(MEGACAP_POOL.slice(i, i + chunkSize));
    }

    const chunkResponses = await Promise.all(
      chunks.map(chunk =>
        yahooFinance.quote(chunk).catch(err => {
          console.error('Chunk quote warning:', err?.message);
          return [];
        })
      )
    );

    const quoteList = chunkResponses.flatMap(q => (Array.isArray(q) ? q : [q]));

    // Deduplicate by symbol and ensure valid USD marketCap
    const seenSymbols = new Set<string>();
    const mapped = quoteList
      .filter((q: any) => {
        if (!q || !q.symbol || (q.marketCap || 0) <= 0) return false;
        if (q.currency && q.currency !== 'USD') return false;
        if (seenSymbols.has(q.symbol)) return false;
        seenSymbols.add(q.symbol);
        return true;
      })
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        marketCap: q.marketCap || 0,
        price: q.regularMarketPrice || q.postMarketPrice || 0,
        changePct: q.regularMarketChangePercent || 0,
        changeAbs: q.regularMarketChange || 0,
        currency: q.currency || 'USD',
        sector: SECTOR_MAP[q.symbol] || 'Equities',
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || null,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow || null,
        trailingPE: q.trailingPE || null,
      }))
      .sort((a: any, b: any) => b.marketCap - a.marketCap)
      .slice(0, 100)
      .map((item: any, idx: number) => ({
        ...item,
        rank: idx + 1,
      }));

    if (mapped.length > 0) {
      cachedTopMarketCap = { timestamp: Date.now(), results: mapped };
    }

    return NextResponse.json(
      { results: mapped, cached: false },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120' } }
    );
  } catch (error: any) {
    console.error('Top Market Cap API Error:', error);
    if (cachedTopMarketCap) {
      return NextResponse.json({ results: cachedTopMarketCap.results, cached: true, stale: true });
    }
    return NextResponse.json({ error: error.message || 'Failed to fetch top market cap companies' }, { status: 500 });
  }
}
