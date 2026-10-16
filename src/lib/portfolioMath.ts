export interface RawTransaction {
  id?: string;
  type: string;
  date: string | Date;
  quantity: number | string;
  price: number | string;
  createdAt?: string | Date;
}

/**
 * Deterministic chronological sort for portfolio transactions:
 * 1. Sort by calendar date ascending (YYYY-MM-DD).
 * 2. On the same calendar date, process share-changing transactions (BUY / SELL)
 *    before average-price overrides (SET_AVG_PRICE), so an override on the same
 *    date always locks in the post-trade average price for all shares held that day.
 * 3. Tie-break by createdAt timestamp ascending.
 */
export function sortTransactionsChronologically<T extends RawTransaction>(transactions: T[]): T[] {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).setHours(0, 0, 0, 0);
    const dateB = new Date(b.date).setHours(0, 0, 0, 0);
    if (dateA !== dateB) return dateA - dateB;

    const aIsOverride = a.type === 'SET_AVG_PRICE' ? 1 : 0;
    const bIsOverride = b.type === 'SET_AVG_PRICE' ? 1 : 0;
    if (aIsOverride !== bIsOverride) return aIsOverride - bIsOverride;

    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return createdA - createdB;
  });
}

/**
 * Computes total shares, average buy price, total cost basis, and realized P/L
 * from a list of transactions, properly handling BUY, SELL, and SET_AVG_PRICE.
 */
export function computeHoldingMetrics<T extends RawTransaction>(transactions: T[]) {
  const chronologicalTxns = sortTransactionsChronologically(transactions);

  let totalQty = 0;
  let totalCostBasis = 0;
  let realizedPL = 0;
  let pendingOverridePrice: number | null = null;

  for (const t of chronologicalTxns) {
    const qty = Number(t.quantity) || 0;
    const price = Number(t.price) || 0;

    if (t.type === 'BUY') {
      totalQty += qty;
      if (pendingOverridePrice !== null) {
        totalCostBasis = totalQty * pendingOverridePrice;
        pendingOverridePrice = null;
      } else {
        totalCostBasis += qty * price;
      }
    } else if (t.type === 'SELL') {
      const currentAvgCost = totalQty > 0 ? totalCostBasis / totalQty : 0;
      const costOfSoldShares = currentAvgCost * qty;
      const saleProceeds = qty * price;

      realizedPL += saleProceeds - costOfSoldShares;
      totalQty -= qty;
      totalCostBasis = totalQty <= 0 ? 0 : totalCostBasis - costOfSoldShares;
    } else if (t.type === 'SET_AVG_PRICE') {
      if (totalQty > 0) {
        totalCostBasis = totalQty * price;
        pendingOverridePrice = null;
      } else {
        pendingOverridePrice = price;
      }
    }
  }

  const avgBuyPrice =
    totalQty > 0
      ? totalCostBasis / totalQty
      : pendingOverridePrice !== null
      ? pendingOverridePrice
      : 0;

  return {
    quantity: totalQty,
    avgBuyPrice,
    totalCostBasis,
    realizedPL,
    chronologicalTxns,
    ledgerTxns: [...chronologicalTxns].reverse(),
  };
}
