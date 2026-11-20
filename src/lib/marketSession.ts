import { fetchWithUtcAuth } from './marketFetch';

export type TradingSession = 'REGULAR' | 'EXTENDED_OVERNIGHT' | 'CLOSED';

/**
 * Post-Nov 13, 2026 consolidated EOD settlement window:
 * Trigger portfolio EOD snapshots after 8:30 PM ET (01:30 UTC) to avoid pulling
 * incomplete after-hours or unsettled close figures prior to the 8:15 PM ET release.
 */
export const EOD_SNAPSHOT_CRON_UTC = '30 1 * * 2-6';

/**
 * Maps provider market-state strings (Yahoo Finance / Massive) into unified
 * session flags ready for the Dec 6, 2026 23-hour U.S. equities trading rollout.
 */
export function normalizeTradingSession(rawState?: string | null): TradingSession {
  const upper = (rawState || '').toUpperCase();
  if (upper === 'REGULAR') {
    return 'REGULAR';
  }
  if (
    upper === 'PRE' ||
    upper === 'PREPRE' ||
    upper === 'POST' ||
    upper === 'POSTPOST' ||
    upper === 'OVERNIGHT' ||
    upper === 'EXTENDED_OVERNIGHT'
  ) {
    return 'EXTENDED_OVERNIGHT';
  }
  return 'CLOSED';
}

/**
 * Evaluates quote freshness using explicit exchange session flags rather than
 * hardcoded 9:30 AM - 4:00 PM ET hours, supporting 23-hour weekday trading.
 */
export function evaluateQuoteFreshness(
  lastTickIso: string,
  sessionState?: TradingSession
): { isStale: boolean; label: string } {
  const ageMs = Date.now() - new Date(lastTickIso).getTime();

  // Respect explicit API session status ahead of Dec 6 23-hour trading rollout
  if (sessionState === 'CLOSED') {
    return { isStale: false, label: 'Market Closed (Last Close)' };
  }

  // During active regular or 23-hour overnight sessions, flag ticks older than 3 mins
  const isStale = ageMs > 180_000;
  return {
    isStale,
    label: isStale ? 'Delayed Quote' : 'Live',
  };
}

export interface InsiderTransactionRecord {
  filingType?: '3' | '4' | '5' | string;
  transactionType?: 'BUY' | 'SELL' | string;
  shares?: number;
  valueUsd?: number;
  transactionDate?: string;
}

export interface InsiderConvictionSignal {
  symbol: string;
  netShares90d: number;
  netValueUsd90d: number;
  buyCount: number;
  sellCount: number;
  convictionScoreDelta: number; // -5 to +5 adjustment for Fundamental (G, M, V) scoring
  trendLabel: 'Net Accumulation' | 'Net Distribution' | 'Neutral';
}

/**
 * Computes net 90-day insider buying/selling conviction from SEC Form 3/4/5 activity
 * to augment fundamental scoring ($G, M, V$).
 */
export function evaluateInsiderConviction(
  symbol: string,
  transactions: InsiderTransactionRecord[]
): InsiderConvictionSignal {
  let netShares90d = 0;
  let netValueUsd90d = 0;
  let buyCount = 0;
  let sellCount = 0;

  for (const tx of transactions) {
    const type = (tx.transactionType || '').toUpperCase();
    const shares = Math.abs(Number(tx.shares || 0));
    const valueUsd = Math.abs(Number(tx.valueUsd || 0));

    if (type === 'BUY' || type === 'P' || type === 'ACQUISITION') {
      buyCount += 1;
      netShares90d += shares;
      netValueUsd90d += valueUsd;
    } else if (type === 'SELL' || type === 'S' || type === 'DISPOSITION') {
      sellCount += 1;
      netShares90d -= shares;
      netValueUsd90d -= valueUsd;
    }
  }

  let convictionScoreDelta = 0;
  let trendLabel: InsiderConvictionSignal['trendLabel'] = 'Neutral';

  if (netValueUsd90d > 250_000 || (buyCount > sellCount && netShares90d > 0)) {
    convictionScoreDelta = Math.min(5, Math.max(1, buyCount - sellCount));
    trendLabel = 'Net Accumulation';
  } else if (netValueUsd90d < -250_000 || (sellCount > buyCount && netShares90d < 0)) {
    convictionScoreDelta = Math.max(-5, Math.min(-1, buyCount - sellCount));
    trendLabel = 'Net Distribution';
  }

  return {
    symbol: symbol.toUpperCase(),
    netShares90d,
    netValueUsd90d,
    buyCount,
    sellCount,
    convictionScoreDelta,
    trendLabel,
  };
}

/**
 * Queries Massive's `/v1/reference/insider-activity` endpoint (SEC Forms 3, 4, and 5)
 * for a given ticker and returns a 90-day conviction summary. Gracefully returns a
 * neutral signal when `FINANCIAL_API_KEY` is not configured.
 */
export async function fetchInsiderActivitySummary(
  symbol: string,
  baseUrl: string = process.env.MASSIVE_API_BASE_URL || 'https://api.massive.com'
): Promise<InsiderConvictionSignal> {
  if (!process.env.FINANCIAL_API_KEY) {
    return evaluateInsiderConviction(symbol, []);
  }

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/v1/reference/insider-activity?ticker=${encodeURIComponent(
      symbol.toUpperCase()
    )}&window=90d`;
    const payload = await fetchWithUtcAuth(url);
    const records: InsiderTransactionRecord[] = Array.isArray(payload?.results)
      ? payload.results
      : [];
    return evaluateInsiderConviction(symbol, records);
  } catch {
    return evaluateInsiderConviction(symbol, []);
  }
}
