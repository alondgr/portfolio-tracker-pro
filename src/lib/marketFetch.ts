const MAX_DRIFT_MS = 30_000; // 30 seconds maximum allowed UTC clock drift

export interface UtcDriftCheckResult {
  valid: boolean;
  driftMs: number;
  timestampUtc: string;
}

/**
 * Validates whether a given ISO-8601 UTC timestamp is within the allowed
 * 30-second drift window from standard UTC clock time.
 */
export function validateUtcTimestampDrift(
  requestTimestamp?: string | null,
  maxDriftMs: number = MAX_DRIFT_MS
): UtcDriftCheckResult {
  const nowMs = Date.now();
  const nowUtc = new Date(nowMs).toISOString();

  if (!requestTimestamp) {
    return { valid: true, driftMs: 0, timestampUtc: nowUtc };
  }

  const parsedMs = Date.parse(requestTimestamp);
  if (Number.isNaN(parsedMs)) {
    return { valid: false, driftMs: Infinity, timestampUtc: nowUtc };
  }

  const driftMs = Math.abs(nowMs - parsedMs);
  return {
    valid: driftMs <= maxDriftMs,
    driftMs,
    timestampUtc: nowUtc,
  };
}

/**
 * Performs an authenticated market API fetch stamped with a synchronized
 * UTC `X-Request-Timestamp` header to satisfy Tier-1 financial gateway
 * replay-protection checks.
 */
export async function fetchWithUtcAuth(
  endpoint: string,
  options: RequestInit & { next?: { revalidate?: number } } = {}
) {
  const nowUtc = new Date().toISOString();

  const headers: Record<string, string> = {
    'X-Request-Timestamp': nowUtc,
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (process.env.FINANCIAL_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.FINANCIAL_API_KEY}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    next: options.next ?? { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Market endpoint error (${res.status}): ${res.statusText}`);
  }

  return res.json();
}
