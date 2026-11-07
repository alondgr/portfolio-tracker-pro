"use client";

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Check,
  Plus,
  Info,
  Crown,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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

const ITEMS_PER_VIEW = 10;

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
  const [currentSlide, setCurrentSlide] = useState(0); // 0 = #1-10, 1 = #11-20

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

  const totalSlides = Math.max(1, Math.ceil(companies.length / ITEMS_PER_VIEW));
  const ownedInTop20 = companies.filter(c => heldSymbols.has(c.symbol)).length;
  const maxMarketCap = companies.length > 0 ? Math.max(...companies.map(c => c.marketCap), 1) : 1;
  const totalTop20MarketCap = companies.reduce((sum, c) => sum + c.marketCap, 0);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

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

  const renderSlideItems = (slideIndex: number) => {
    const startIdx = slideIndex * ITEMS_PER_VIEW;
    const slice = companies.slice(startIdx, startIdx + ITEMS_PER_VIEW);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full shrink-0">
        {slice.map((company) => {
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
    );
  };

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl mb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-amber-400" />
            <h3 className="text-lg font-semibold text-fintech-text uppercase tracking-widest opacity-80">
              Top 20 Largest Companies by Market Cap
            </h3>
          </div>
          <p className="text-xs text-fintech-muted mt-1">
            Live global mega-cap leaderboard ranked by total market capitalization (showing #{currentSlide * ITEMS_PER_VIEW + 1}–#{Math.min((currentSlide + 1) * ITEMS_PER_VIEW, companies.length || 20)})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
          {companies.length > 0 && (
            <>
              <div className="px-3 py-1.5 rounded-xl bg-fintech-bg border border-fintech-border text-xs font-medium text-fintech-muted">
                Top 20 Combined:{' '}
                <span className="text-white font-bold">{formatMarketCap(totalTop20MarketCap)}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
                {ownedInTop20}/{companies.length} Owned
              </div>
            </>
          )}

          {/* Carousel Controls in Header */}
          {totalSlides > 1 && (
            <div className="flex items-center bg-fintech-bg border border-fintech-border rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="p-1.5 rounded-lg text-fintech-muted hover:text-white hover:bg-fintech-card transition-colors"
                title="Previous 10"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalSlides }).map((_, idx) => {
                const startRank = idx * ITEMS_PER_VIEW + 1;
                const endRank = Math.min((idx + 1) * ITEMS_PER_VIEW, companies.length || 20);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      currentSlide === idx
                        ? 'bg-fintech-accent text-white shadow-sm'
                        : 'text-fintech-muted hover:text-white'
                    }`}
                  >
                    #{startRank}–{endRank}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleNextSlide}
                className="p-1.5 rounded-lg text-fintech-muted hover:text-white hover:bg-fintech-card transition-colors"
                title="Next 10"
              >
                <ChevronRight size={15} />
              </button>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
        <>
          {/* Sliding Carousel Viewport */}
          <div className="overflow-hidden w-full">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIdx) => (
                <div key={slideIdx} className="w-full shrink-0">
                  {renderSlideItems(slideIdx)}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Carousel Navigation Dots & Arrows */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5 pt-3 border-t border-fintech-border/40">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="flex items-center gap-1 text-xs font-semibold text-fintech-muted hover:text-white px-2.5 py-1 rounded-lg hover:bg-fintech-bg transition-colors"
              >
                <ChevronLeft size={14} />
                Prev 10
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`View slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx
                        ? 'w-7 bg-fintech-accent'
                        : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextSlide}
                className="flex items-center gap-1 text-xs font-semibold text-fintech-muted hover:text-white px-2.5 py-1 rounded-lg hover:bg-fintech-bg transition-colors"
              >
                Next 10
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
