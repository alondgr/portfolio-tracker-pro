"use client";

import React, { useEffect, useState } from 'react';
import { Globe, TrendingUp, TrendingDown, RefreshCw, Check, Plus, Info, Crown, Eye } from 'lucide-react';

interface TopMarketCapCompany {
  rank: number;
  symbol: string;
  name: string;
  marketCap: number;
  price: number;
  changePct: number;
  changeAbs: number;
  currency: string;
  sector: string;
  trailingPE?: number | null;
}

interface TopMarketCapWidgetProps {
  holdings: any[];
  watchlist: any[];
  currencySymbol: string;
  convertValue: (value: number, fromCurrency?: string) => number;
  formatCurrency: (value: number, noDecimals?: boolean) => string;
  onSelectSymbol?: (symbol: string) => void;
  onQuickAddHolding?: (symbol: string, currentPrice: number) => void;
}

export default function TopMarketCapWidget({
  holdings,
  watchlist,
  currencySymbol,
  convertValue,
  formatCurrency,
  onSelectSymbol,
  onQuickAddHolding,
}: TopMarketCapWidgetProps) {
  const [companies, setCompanies] = useState<TopMarketCapCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopMarketCap = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/top-market-cap');
      if (!res.ok) throw new Error('Failed to load market cap rankings');
      const data = await res.json();
      setCompanies(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load top market cap companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopMarketCap();
  }, []);

  const formatMarketCap = (usdMarketCap: number, fromCurrency: string = 'USD') => {
    const converted = convertValue(usdMarketCap, fromCurrency);
    if (converted >= 1e12) {
      return `${currencySymbol}${(converted / 1e12).toFixed(2)}T`;
    }
    if (converted >= 1e9) {
      return `${currencySymbol}${(converted / 1e9).toFixed(1)}B`;
    }
    if (converted >= 1e6) {
      return `${currencySymbol}${(converted / 1e6).toFixed(1)}M`;
    }
    return formatCurrency(converted, true);
  };

  const heldSymbols = new Set(holdings.filter(h => h.quantity > 0).map(h => h.symbol));
  const watchlistSymbols = new Set(watchlist.map(w => w.symbol));

  const ownedInTop10 = companies.filter(c => heldSymbols.has(c.symbol)).length;
  const maxMarketCap = companies.length > 0 ? Math.max(...companies.map(c => c.marketCap), 1) : 1;
  const totalTop10MarketCap = companies.reduce((sum, c) => sum + c.marketCap, 0);

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) {
      return 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.4)] font-extrabold';
    }
    if (rank === 2) {
      return 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-extrabold';
    }
    if (rank === 3) {
      return 'bg-gradient-to-br from-amber-600 to-orange-700 text-white font-extrabold';
    }
    return 'bg-slate-800/90 text-slate-300 border border-slate-700 font-bold';
  };

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-400" />
            <h3 className="text-lg font-semibold text-fintech-text uppercase tracking-widest opacity-80">
              Top 10 Largest Companies by Market Cap
            </h3>
          </div>
          <p className="text-xs text-fintech-muted mt-1">
            Live global mega-cap leaderboard ranked by total market capitalization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {companies.length > 0 && (
            <>
              <div className="px-3 py-1.5 rounded-xl bg-fintech-bg border border-fintech-border text-xs font-medium text-fintech-muted">
                Top 10 Combined:{' '}
                <span className="text-white font-bold">{formatMarketCap(totalTop10MarketCap)}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
                {ownedInTop10}/10 Owned
              </div>
            </>
          )}
          <button
            type="button"
            onClick={fetchTopMarketCap}
            disabled={loading}
            className="p-2 rounded-xl bg-fintech-bg border border-fintech-border hover:border-fintech-accent text-fintech-muted hover:text-white transition-colors disabled:opacity-50"
            title="Refresh Market Cap Rankings"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-fintech-accent' : ''} />
          </button>
        </div>
      </div>

      {loading && companies.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="h-20 rounded-xl bg-fintech-bg/50 border border-fintech-border/50 animate-pulse p-4"
            />
          ))}
        </div>
      ) : error && companies.length === 0 ? (
        <div className="py-10 text-center text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {companies.map((company) => {
            const isOwned = heldSymbols.has(company.symbol);
            const isWatched = !isOwned && watchlistSymbols.has(company.symbol);
            const isPositive = (company.changePct || 0) >= 0;
            const capWidthPct = Math.max(8, Math.round((company.marketCap / maxMarketCap) * 100));

            return (
              <div
                key={company.symbol}
                onClick={() => onSelectSymbol && onSelectSymbol(company.symbol)}
                className={`group relative rounded-xl p-4 bg-fintech-bg/50 border transition-all cursor-pointer overflow-hidden ${
                  isOwned
                    ? 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/10'
                    : 'border-fintech-border/70 hover:border-fintech-accent/60'
                }`}
              >
                {/* Proportional Market Cap Bar at bottom */}
                <div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-fintech-accent/70 via-indigo-400/70 to-emerald-400/70 transition-all duration-500"
                  style={{ width: `${capWidthPct}%` }}
                />

                <div className="flex items-center justify-between gap-3">
                  {/* Left: Rank + Symbol & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${getRankBadgeClass(
                        company.rank
                      )}`}
                    >
                      #{company.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base group-hover:text-fintech-accent transition-colors flex items-center gap-1">
                          {company.symbol}
                          <Info
                            size={12}
                            className="opacity-0 group-hover:opacity-100 text-fintech-accent transition-opacity"
                          />
                        </span>
                        {isOwned && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                            <Check size={9} /> OWNED
                          </span>
                        )}
                        {isWatched && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                            <Eye size={9} /> WATCHING
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium hidden sm:inline-block">
                          {company.sector}
                        </span>
                      </div>
                      <div className="text-xs text-fintech-muted truncate max-w-[180px] sm:max-w-[230px] mt-0.5">
                        {company.name}
                      </div>
                    </div>
                  </div>

                  {/* Right: Market Cap + Price + Change + Quick Add */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-white tracking-tight">
                        {formatMarketCap(company.marketCap, company.currency)}
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-0.5">
                        <span className="text-xs text-fintech-muted font-medium">
                          {formatCurrency(convertValue(company.price, company.currency))}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                            isPositive
                              ? 'bg-fintech-profit/20 text-fintech-profit'
                              : 'bg-fintech-loss/20 text-fintech-loss'
                          }`}
                        >
                          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isPositive ? '+' : ''}
                          {(company.changePct || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {onQuickAddHolding && !isOwned && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAddHolding(company.symbol, company.price);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-fintech-accent/20 text-fintech-accent hover:bg-fintech-accent hover:text-white transition-all"
                        title={`Add ${company.symbol} to Portfolio`}
                      >
                        <Plus size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
