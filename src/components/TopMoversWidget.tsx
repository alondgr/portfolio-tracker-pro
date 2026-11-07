"use client";

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Flame, Award, AlertTriangle, Info } from 'lucide-react';

interface TopMoversWidgetProps {
  holdings: any[];
  watchlist?: any[];
  hideValues: boolean;
  formatCurrency: (value: number, noDecimals?: boolean) => string;
  convertValue: (value: number, fromCurrency?: string) => number;
  onSelectSymbol?: (symbol: string) => void;
}

export default function TopMoversWidget({
  holdings,
  watchlist = [],
  hideValues,
  formatCurrency,
  convertValue,
  onSelectSymbol,
}: TopMoversWidgetProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'alltime'>('today');
  const [includeWatchlist, setIncludeWatchlist] = useState(false);

  // Build unified pool for Today's Movers
  const todayPool = React.useMemo(() => {
    const portfolioItems = holdings.map(h => ({
      symbol: h.symbol,
      name: h.name || h.symbol,
      price: convertValue(h.currentPrice || 0, h.currency),
      changePct: h.dailyChangePct ?? 0,
      changeVal: convertValue((h.dailyChange || 0) * (h.quantity || 0), h.currency),
      isWatchlistOnly: false,
      sector: h.sector,
    }));

    if (!includeWatchlist) return portfolioItems;

    const heldSymbols = new Set(holdings.map(h => h.symbol));
    const watchlistItems = watchlist
      .filter(w => !heldSymbols.has(w.symbol) && w.price !== undefined)
      .map(w => ({
        symbol: w.symbol,
        name: w.name || w.symbol,
        price: convertValue(w.price || 0, w.currency),
        changePct: w.change ?? 0,
        changeVal: convertValue(w.changeAbs || 0, w.currency),
        isWatchlistOnly: true,
        sector: w.sector,
      }));

    return [...portfolioItems, ...watchlistItems];
  }, [holdings, watchlist, includeWatchlist, convertValue]);

  // Build pool for All-Time Performers (portfolio holdings only since watchlist has no cost basis)
  const allTimePool = React.useMemo(() => {
    return holdings.map(h => {
      const plPct = h.unrealizedPLPercent ?? h.unrealizedPLPct ?? 0;
      const plVal = convertValue(h.unrealizedPL || 0, h.currency);
      return {
        symbol: h.symbol,
        name: h.name || h.symbol,
        price: convertValue(h.currentPrice || 0, h.currency),
        changePct: plPct,
        changeVal: plVal,
        isWatchlistOnly: false,
        sector: h.sector,
      };
    });
  }, [holdings, convertValue]);

  const activePool = activeTab === 'today' ? todayPool : allTimePool;

  const gainers = [...activePool]
    .filter(item => item.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, 4);

  const losers = [...activePool]
    .filter(item => item.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, 4);

  const advancingCount = activePool.filter(i => i.changePct > 0).length;
  const decliningCount = activePool.filter(i => i.changePct < 0).length;
  const flatCount = activePool.length - advancingCount - decliningCount;
  const advancingRatio = activePool.length > 0 ? (advancingCount / activePool.length) * 100 : 50;

  const maxGainerPct = gainers.length > 0 ? Math.max(...gainers.map(g => Math.abs(g.changePct)), 0.01) : 1;
  const maxLoserPct = losers.length > 0 ? Math.max(...losers.map(l => Math.abs(l.changePct)), 0.01) : 1;

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-amber-400" />
            <h3 className="text-lg font-semibold text-fintech-text uppercase tracking-widest opacity-80">
              Top Movers &amp; Leaders
            </h3>
          </div>
          <p className="text-xs text-fintech-muted mt-1">
            {activeTab === 'today'
              ? 'Biggest daily percentage movers and P/L impact today'
              : 'All-time best and worst unrealized return leaders in your portfolio'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {activeTab === 'today' && watchlist.length > 0 && (
            <button
              type="button"
              onClick={() => setIncludeWatchlist(!includeWatchlist)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                includeWatchlist
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-fintech-bg border-fintech-border text-fintech-muted hover:text-white'
              }`}
              title="Include Watchlist stocks in Today's Movers"
            >
              {includeWatchlist ? '+ Watchlist Included' : 'Portfolio Only'}
            </button>
          )}

          <div className="flex bg-fintech-bg border border-fintech-border rounded-xl p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'today'
                  ? 'bg-fintech-accent text-white shadow-md'
                  : 'text-fintech-muted hover:text-white'
              }`}
            >
              <Flame size={13} />
              Today&apos;s Movers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alltime')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'alltime'
                  ? 'bg-fintech-accent text-white shadow-md'
                  : 'text-fintech-muted hover:text-white'
              }`}
            >
              <Award size={13} />
              All-Time P/L
            </button>
          </div>
        </div>
      </div>

      {activePool.length === 0 ? (
        <div className="py-12 text-center text-fintech-muted italic bg-fintech-bg/40 rounded-xl border border-dashed border-fintech-border">
          No holdings available yet to calculate top movers.
        </div>
      ) : (
        <>
          {/* Breadth Bar */}
          <div className="mb-6 bg-fintech-bg/60 border border-fintech-border/60 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-fintech-profit flex items-center gap-1.5">
                <TrendingUp size={14} />
                {advancingCount} {activeTab === 'today' ? 'Advancing' : 'In Profit'}
              </span>
              {flatCount > 0 && (
                <span className="text-fintech-muted">{flatCount} Unchanged</span>
              )}
              <span className="text-fintech-loss flex items-center gap-1.5">
                {decliningCount} {activeTab === 'today' ? 'Declining' : 'In Loss'}
                <TrendingDown size={14} />
              </span>
            </div>
            <div className="w-full h-2 bg-rose-500/30 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${advancingRatio}%` }}
              />
            </div>
          </div>

          {/* Gainers & Losers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gainers Column */}
            <div className="bg-fintech-bg/40 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-fintech-border/60">
                <div className="flex items-center gap-2 text-sm font-bold text-fintech-profit uppercase tracking-wider">
                  <TrendingUp size={16} />
                  <span>{activeTab === 'today' ? 'Top Gainers Today' : 'All-Time Leaders'}</span>
                </div>
                <span className="text-[11px] text-fintech-muted uppercase">
                  {activeTab === 'today' ? 'Daily Change' : 'Total Return'}
                </span>
              </div>

              {gainers.length === 0 ? (
                <div className="py-8 text-center text-xs text-fintech-muted italic">
                  No positive movers for this period.
                </div>
              ) : (
                <div className="space-y-3">
                  {gainers.map((item) => {
                    const barWidth = Math.max(8, Math.round((Math.abs(item.changePct) / maxGainerPct) * 100));
                    return (
                      <div
                        key={item.symbol}
                        onClick={() => onSelectSymbol && onSelectSymbol(item.symbol)}
                        className="group relative p-3 rounded-xl bg-fintech-card/80 border border-fintech-border/60 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden"
                      >
                        <div
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500/60 to-emerald-400 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-fintech-accent transition-colors flex items-center gap-1">
                                {item.symbol}
                                <Info size={11} className="opacity-0 group-hover:opacity-100 text-fintech-accent transition-opacity" />
                              </span>
                              {item.isWatchlistOnly && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                                  Watchlist
                                </span>
                              )}
                              <span className="text-xs text-fintech-muted font-medium">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                            <div className="text-xs text-fintech-muted truncate max-w-[200px] mt-0.5">
                              {item.name}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-fintech-profit/20 text-fintech-profit font-bold text-sm">
                              <TrendingUp size={13} />
                              +{item.changePct.toFixed(2)}%
                            </div>
                            <div className="text-xs text-fintech-profit/90 font-medium mt-0.5">
                              {item.isWatchlistOnly
                                ? `${item.changeVal >= 0 ? '+' : ''}${formatCurrency(item.changeVal)} / sh`
                                : hideValues
                                ? '****'
                                : `+${formatCurrency(item.changeVal)}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Losers Column */}
            <div className="bg-fintech-bg/40 border border-rose-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-fintech-border/60">
                <div className="flex items-center gap-2 text-sm font-bold text-fintech-loss uppercase tracking-wider">
                  <AlertTriangle size={16} />
                  <span>{activeTab === 'today' ? 'Top Losers Today' : 'All-Time Laggards'}</span>
                </div>
                <span className="text-[11px] text-fintech-muted uppercase">
                  {activeTab === 'today' ? 'Daily Change' : 'Total Return'}
                </span>
              </div>

              {losers.length === 0 ? (
                <div className="py-8 text-center text-xs text-fintech-muted italic">
                  No negative movers for this period! 🎉
                </div>
              ) : (
                <div className="space-y-3">
                  {losers.map((item) => {
                    const barWidth = Math.max(8, Math.round((Math.abs(item.changePct) / maxLoserPct) * 100));
                    return (
                      <div
                        key={item.symbol}
                        onClick={() => onSelectSymbol && onSelectSymbol(item.symbol)}
                        className="group relative p-3 rounded-xl bg-fintech-card/80 border border-fintech-border/60 hover:border-rose-500/50 transition-all cursor-pointer overflow-hidden"
                      >
                        <div
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-rose-500/60 to-rose-400 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-fintech-accent transition-colors flex items-center gap-1">
                                {item.symbol}
                                <Info size={11} className="opacity-0 group-hover:opacity-100 text-fintech-accent transition-opacity" />
                              </span>
                              {item.isWatchlistOnly && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                                  Watchlist
                                </span>
                              )}
                              <span className="text-xs text-fintech-muted font-medium">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                            <div className="text-xs text-fintech-muted truncate max-w-[200px] mt-0.5">
                              {item.name}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-fintech-loss/20 text-fintech-loss font-bold text-sm">
                              <TrendingDown size={13} />
                              {item.changePct.toFixed(2)}%
                            </div>
                            <div className="text-xs text-fintech-loss/90 font-medium mt-0.5">
                              {item.isWatchlistOnly
                                ? `${formatCurrency(item.changeVal)} / sh`
                                : hideValues
                                ? '****'
                                : formatCurrency(item.changeVal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
