export interface Transaction {
  type: string;
  quantity: number;
  date: string | Date;
}

export interface DividendEvent {
  date: Date;
  amount: number;
}

export interface DividendHistoryItem {
  symbol: string;
  date: Date;
  amountPerShare: number;
  shares: number;
  totalPayout: number;
  currency: string;
}

export function calculateDividends(
  transactions: Transaction[],
  dividendEvents: DividendEvent[],
  symbol: string,
  currency: string
): { totalDividendsReceived: number; dividendHistory: DividendHistoryItem[] } {
  let totalDividendsReceived = 0;
  const dividendHistory: DividendHistoryItem[] = [];

  dividendEvents.forEach((divEvent) => {
    let sharesOwned = 0;
    
    transactions.forEach((t) => {
      const tDate = new Date(t.date);
      const tDay = new Date(Date.UTC(tDate.getUTCFullYear(), tDate.getUTCMonth(), tDate.getUTCDate()));
      const divDay = new Date(Date.UTC(divEvent.date.getUTCFullYear(), divEvent.date.getUTCMonth(), divEvent.date.getUTCDate()));
      
      if (tDay < divDay) {
        if (t.type === 'BUY') sharesOwned += t.quantity;
        else if (t.type === 'SELL') sharesOwned -= t.quantity;
      }
    });

    if (sharesOwned > 0) {
      const payout = sharesOwned * divEvent.amount;
      totalDividendsReceived += payout;
      dividendHistory.push({
        symbol,
        date: divEvent.date,
        amountPerShare: divEvent.amount,
        shares: sharesOwned,
        totalPayout: payout,
        currency,
      });
    }
  });

  return { totalDividendsReceived, dividendHistory };
}
