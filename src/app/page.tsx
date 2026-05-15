"use client";

import React, { useEffect, useState } from 'react';
import AllocationCharts from '@/components/AllocationCharts';
import PerformanceChart from '@/components/PerformanceChart';
import TickerTape from '@/components/TickerTape';
import WisdomQuote from '@/components/WisdomQuote';
import { Plus, TrendingUp, TrendingDown, RefreshCw, AlertCircle, RefreshCcw, ArrowUpDown, ChevronUp, ChevronDown, Trash2, Edit2, Eye, EyeOff, Search, Building2, Coins } from 'lucide-react';
import { useUser, SignUpButton, UserButton } from '@clerk/nextjs';
import { useConversionTimer } from '@/hooks/useConversionTimer';
import { Info, X } from 'lucide-react';

const HATEFUL_8 = ['NVDA', 'PLTR', 'COIN', 'CRCL', 'GOLD', 'OXY', 'B', 'NEE', 'IRM'];

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { showSignupPrompt, startTimer } = useConversionTimer();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHateful8, setShowHateful8] = useState(false);
  const [hideValues, setHideValues] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Column Visibility State
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    index: true,
    symbol: true,
    quantity: true,
    avgBuyPrice: true,
    currentPrice: true,
    marketValue: true,
    dailyChange: true,
    unrealizedPL: true,
    yieldPct: true,
    sector: true,
    industry: true,
    actions: true
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Row expansion state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Main Modal state (for fresh additions only now)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ symbol: '', quantity: '1', avgBuyPrice: '', date: new Date().toISOString().split('T')[0] });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  const currencySymbols: Record<string, string> = {
    USD: '$',
    ILS: '₪',
    EUR: '€',
    GBP: '£'
  };

  // Inline Transaction Form state
  const [txnFormActiveSymbol, setTxnFormActiveSymbol] = useState<string | null>(null);
  const [txnForm, setTxnForm] = useState({ type: 'BUY', quantity: '', price: '', date: new Date().toISOString().split('T')[0] });

  // Inline Edit Transaction state
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
  const [editTxnForm, setEditTxnForm] = useState({ type: 'BUY', quantity: '', price: '', date: '' });

  const migrateLocalData = async () => {
    const localHoldings = JSON.parse(localStorage.getItem('ghost_holdings') || '[]');
    if (localHoldings.length === 0) return;

    for (const holding of localHoldings) {
      try {
        await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addTransaction',
            symbol: holding.symbol,
            type: 'BUY',
            quantity: holding.quantity.toString(),
            avgBuyPrice: holding.avgBuyPrice.toString(),
            date: new Date().toISOString().split('T')[0]
          })
        });
      } catch (err) {
        console.error('Failed to migrate holding:', holding.symbol, err);
      }
    }
    localStorage.removeItem('ghost_holdings');
    localStorage.removeItem('ghost_timer_start');
    fetchPortfolio();
  };

  useEffect(() => {
    if (user && isLoaded && localStorage.getItem('ghost_holdings')) {
      migrateLocalData();
    }
  }, [user, isLoaded]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      if (user) {
        const res = await fetch('/api/portfolio');
        if (!res.ok) throw new Error('Failed to fetch portfolio');
        const data = await res.json();
        setHoldings(data.holdings || []);
      } else {
        // Ghost Mode: Load from LocalStorage
        const localHoldings = JSON.parse(localStorage.getItem('ghost_holdings') || '[]');
        
        // We still need real-time quotes for local holdings
        if (localHoldings.length > 0) {
          const symbols = localHoldings.map((h: any) => h.symbol).join(',');
          const quoteRes = await fetch(`/api/market-data?symbols=${symbols}`);
          if (quoteRes.ok) {
            const marketData = await quoteRes.json();
            const quotes = Array.isArray(marketData) ? marketData : (marketData.results || []);
            const updated = localHoldings.map((h: any) => {
              const quote = quotes.find((m: any) => m.symbol === h.symbol);
              if (quote) {
                const currentPrice = quote.price;
                const marketValue = h.quantity * currentPrice;
                const unrealizedPL = marketValue - (h.quantity * h.avgBuyPrice);
                const unrealizedPLPct = ((currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100;
                return {
                  ...h,
                  currentPrice,
                  marketValue,
                  unrealizedPL,
                  unrealizedPLPct,
                  dailyChange: quote.changeAbs || 0,
                  dailyChangePct: quote.change || 0,
                  currency: quote.currency || 'USD',
                  sector: quote.sector || "Unknown",
                  industry: quote.industry || "Unknown",
                  transactions: h.transactions || []
                };
              }
              return h;
            });
            setHoldings(updated);
          } else {
            setHoldings(localHoldings);
          }
        } else {
          setHoldings([]);
        }
      }
      setLastUpdated(new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async (symbols?: string[]) => {
    if (!user) {
      setPerformanceData([]);
      return;
    }
    try {
      const url = symbols && symbols.length > 0 
        ? `/api/performance?symbols=${symbols.join(',')}` 
        : '/api/performance';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch performance');
      const data = await res.json();
      setPerformanceData(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/exchange-rates');
      const data = await res.json();
      if (data.rates) setRates(data.rates);
    } catch (err) {
      console.error('Error fetching rates:', err);
    }
  };

  const fetchMarketData = async () => {
    try {
      const res = await fetch('/api/market-data');
      const data = await res.json();
      if (data.results) setMarketData(data.results);
    } catch (err) {
      console.error('Error fetching market data:', err);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    fetchPortfolio();
    fetchRates();
    fetchMarketData();
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (showHateful8) {
      fetchPerformance(HATEFUL_8);
    } else {
      fetchPerformance();
    }
  }, [showHateful8, isLoaded, user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.symbol-search-container')) {
        setShowDropdown(false);
      }
      if (!target.closest('.column-dropdown-container')) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleRow = (symbol: string) => {
    setExpandedRows(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  // Add a brand new stock
  const handleAddFreshHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (user) {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addTransaction',
            symbol: formData.symbol,
            type: 'BUY',
            quantity: formData.quantity,
            price: formData.avgBuyPrice,
            date: formData.date
          }),
        });
        if (!res.ok) throw new Error('Failed to save holding');
      } else {
        // Ghost Mode
        const localHoldings = JSON.parse(localStorage.getItem('ghost_holdings') || '[]');
        const existing = localHoldings.find((h: any) => h.symbol === formData.symbol.toUpperCase());
        
        if (existing) {
          existing.quantity += Number(formData.quantity);
          // Simple avg price calculation for ghost mode
          existing.avgBuyPrice = ((existing.avgBuyPrice * (existing.quantity - Number(formData.quantity))) + (Number(formData.avgBuyPrice) * Number(formData.quantity))) / existing.quantity;
          existing.transactions.push({
            id: 'ghost-' + Date.now(),
            type: 'BUY',
            quantity: Number(formData.quantity),
            price: Number(formData.avgBuyPrice),
            date: formData.date
          });
        } else {
          localHoldings.push({
            symbol: formData.symbol.toUpperCase(),
            quantity: Number(formData.quantity),
            avgBuyPrice: Number(formData.avgBuyPrice),
            date: formData.date,
            transactions: [{
              id: 'ghost-' + Date.now(),
              type: 'BUY',
              quantity: Number(formData.quantity),
              price: Number(formData.avgBuyPrice),
              date: formData.date
            }]
          });
        }
        localStorage.setItem('ghost_holdings', JSON.stringify(localHoldings));
        startTimer(); // Start the conversion timer
      }
      
      await fetchPortfolio();
      setShowModal(false);
      setFormData({ symbol: '', quantity: '1', avgBuyPrice: '', date: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSymbolSearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    setShowDropdown(true);
    try {
      const res = await fetch(`/api/search?q=${query}`);
      if (!res.ok) {
        setSearchResults([]);
        return;
      }
      const data = await res.json();
      setSearchResults(data.result || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchCurrentPrice = async (symbol: string) => {
    try {
      const res = await fetch(`/api/price?symbol=${symbol}`);
      const data = await res.json();
      if (data.price) {
        setFormData(prev => ({ ...prev, avgBuyPrice: data.price.toString() }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectSymbol = (suggestion: any) => {
    setFormData(prev => ({ ...prev, symbol: suggestion.symbol }));
    setShowDropdown(false);
    fetchCurrentPrice(suggestion.symbol);
  };

  const convertValue = (value: number, fromCurrency: string = 'USD') => {
    // Standardize currency name (Yahoo sometimes returns uppercase or lowercase)
    const from = fromCurrency.toUpperCase();
    const to = selectedCurrency.toUpperCase();
    
    if (from === to) return value;
    
    // value is in 'from', convert to USD first
    const usdValue = from === 'USD' ? value : value / (rates[from] || 1);
    // convert USD to 'to'
    return to === 'USD' ? usdValue : usdValue * (rates[to] || 1);
  };

  const formatCurrency = (value: number) => {
    if (value === undefined || value === null) return '---';
    return `${currencySymbols[selectedCurrency] || '$'}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleEditTransactionSubmit = async (e: React.FormEvent, symbol: string) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (user) {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'editTransaction',
            symbol,
            transactionId: editingTxnId,
            ...editTxnForm
          }),
        });
        if (!res.ok) throw new Error('Failed to edit transaction');
      } else {
        // Ghost Mode
        const localHoldings = JSON.parse(localStorage.getItem('ghost_holdings') || '[]');
        const holding = localHoldings.find((h: any) => h.symbol === symbol);
        if (holding) {
          const txnIndex = holding.transactions.findIndex((t: any) => t.id === editingTxnId);
          if (txnIndex !== -1) {
            holding.transactions[txnIndex] = {
              ...holding.transactions[txnIndex],
              ...editTxnForm,
              quantity: Number(editTxnForm.quantity),
              price: Number(editTxnForm.price)
            };
            
            // Recalculate total quantity and avg price
            let totalQty = 0;
            let totalCost = 0;
            holding.transactions.forEach((t: any) => {
              const q = Number(t.quantity);
              const p = Number(t.price);
              if (t.type === 'BUY') {
                totalQty += q;
                totalCost += q * p;
              } else {
                totalQty -= q;
              }
            });
            holding.quantity = totalQty;
            holding.avgBuyPrice = totalQty > 0 ? totalCost / totalQty : 0;
            
            localStorage.setItem('ghost_holdings', JSON.stringify(localHoldings));
          }
        }
      }
      
      await fetchPortfolio();
      setEditingTxnId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add transaction to existing stock
  const handleAddTransaction = async (e: React.FormEvent, symbol: string) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (user) {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addTransaction',
            symbol,
            ...txnForm
          }),
        });
        if (!res.ok) throw new Error('Failed to add transaction');
      } else {
        // Ghost Mode
        const localHoldings = JSON.parse(localStorage.getItem('ghost_holdings') || '[]');
        const holding = localHoldings.find((h: any) => h.symbol === symbol);
        if (holding) {
          const qty = Number(txnForm.quantity);
          const price = Number(txnForm.price);
          
          if (txnForm.type === 'BUY') {
            holding.avgBuyPrice = ((holding.avgBuyPrice * holding.quantity) + (price * qty)) / (holding.quantity + qty);
            holding.quantity += qty;
          } else {
            holding.quantity -= qty;
          }
          
          holding.transactions.push({
            id: 'ghost-' + Date.now(),
            ...txnForm,
            quantity: qty,
            price: price
          });
          localStorage.setItem('ghost_holdings', JSON.stringify(localHoldings));
        }
      }
      
      await fetchPortfolio();
      setTxnForm({ type: 'BUY', quantity: '', price: '', date: new Date().toISOString().split('T')[0] });
      setTxnFormActiveSymbol(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteTransaction = async (symbol: string, transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      if (user) {
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deleteTransaction', symbol, transactionId }),
        });
        if (!res.ok) throw new Error('Failed to delete transaction');
      } else {
        // Ghost Mode
        const localHoldings = JSON.parse(localStorage.getItem('ghost_holdings') || '[]');
        const holding = localHoldings.find((h: any) => h.symbol === symbol);
        if (holding) {
          holding.transactions = holding.transactions.filter((t: any) => t.id !== transactionId);
          
          // Recalculate totals
          let totalQty = 0;
          let totalCost = 0;
          holding.transactions.forEach((t: any) => {
            const q = Number(t.quantity);
            const p = Number(t.price);
            if (t.type === 'BUY') {
              totalQty += q;
              totalCost += q * p;
            } else {
              totalQty -= q;
            }
          });
          holding.quantity = totalQty;
          holding.avgBuyPrice = totalQty > 0 ? totalCost / totalQty : 0;
          
          if (holding.transactions.length === 0) {
            const index = localHoldings.indexOf(holding);
            localHoldings.splice(index, 1);
          }
          
          localStorage.setItem('ghost_holdings', JSON.stringify(localHoldings));
        }
      }
      
      await fetchPortfolio();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openHoldingsSource = holdings.filter(h => h.quantity > 0);
  const closedHoldingsSource = holdings.filter(h => h.quantity <= 0);

  const filteredHoldings = showHateful8
    ? openHoldingsSource.filter(h => HATEFUL_8.includes(h.symbol))
    : openHoldingsSource;

  const closedHoldings = showHateful8
    ? closedHoldingsSource.filter(h => HATEFUL_8.includes(h.symbol))
    : closedHoldingsSource;

  // Sorting logic
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    let aVal = a[key] ?? '';
    let bVal = b[key] ?? '';

    if (typeof aVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate totals (converting everything to selected currency)
  const totalMarketValue = filteredHoldings.reduce((sum, h) => sum + convertValue(h.marketValue || 0, h.currency), 0);
  const totalCostBasis = filteredHoldings.reduce((sum, h) => sum + convertValue(h.avgBuyPrice * h.quantity, h.currency), 0);
  // Realized P/L is extremely hard to calculate accurately without complex FIFO handling, so we rely on Unrealized against open cost basis.
  const totalUnrealizedPL = totalMarketValue - totalCostBasis;
  const totalYieldSum = filteredHoldings.reduce((sum, h) => sum + ((h.yieldPct || 0) * convertValue(h.marketValue || 0, h.currency)), 0);
  const avgYield = totalMarketValue > 0 ? (totalYieldSum / totalMarketValue) : 0;

  const isProfit = totalUnrealizedPL >= 0;

  const tickerItems = [
    ...marketData.map(m => {
      let symbol = m.symbol;
      if (symbol === '^GSPC') symbol = 'S&P 500';
      if (symbol === '^IXIC') symbol = 'NASDAQ';
      if (symbol === '^DJI') symbol = 'DOW J';
      if (symbol === 'BTC-USD') symbol = 'BTC';
      if (symbol === 'ETH-USD') symbol = 'ETH';
      if (symbol === 'GC=F') symbol = 'GOLD';
      if (symbol === 'SI=F') symbol = 'SILVER';
      if (symbol === 'HG=F') symbol = 'COPPER';
      if (symbol === 'CL=F') symbol = 'WTI OIL';
      if (symbol === 'VNQ') symbol = 'VNQ';
      if (symbol === '^VIX') symbol = 'VIX';
      if (symbol === '^TNX') symbol = '10Y YIELD';
      if (symbol === 'DX-Y.NYB') symbol = 'DXY';
      
      const isYieldOrVix = symbol === 'VIX' || symbol === '10Y YIELD';
      
      return {
        symbol,
        price: isYieldOrVix ? m.price.toFixed(2) : formatCurrency(convertValue(m.price)),
        change: m.change.toFixed(2) + '%',
      };
    }),
    ...holdings.filter(h => HATEFUL_8.includes(h.symbol)).map(h => ({
      symbol: h.symbol,
      price: formatCurrency(convertValue(h.currentPrice, h.currency)),
      change: (h.unrealizedPLPercent || 0).toFixed(2) + '%',
      isCustom: true
    }))
  ];

  const SortableHeader = ({ label, sortKey, alignRight = false, alignCenter = false, className = "" }: { label: string, sortKey: string, alignRight?: boolean, alignCenter?: boolean, className?: string }) => {
    return (
      <th
        className={`p-5 font-semibold cursor-pointer select-none group hover:text-white transition-colors ${alignRight ? 'text-right' : alignCenter ? 'text-center' : ''} ${className}`}
        onClick={() => requestSort(sortKey)}
      >
        <div className={`flex items-center gap-1 ${alignRight ? 'justify-end' : alignCenter ? 'justify-center' : ''}`}>
          {label}
          {sortConfig?.key === sortKey ? (
            sortConfig.direction === 'asc' ? (
              <ChevronUp size={14} className="text-fintech-accent" />
            ) : (
              <ChevronDown size={14} className="text-fintech-accent" />
            )
          ) : (
            <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 text-fintech-muted transition-opacity" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="min-h-screen bg-fintech-bg text-fintech-text p-4 md:p-10 pb-24 overflow-x-hidden max-w-full selection:bg-fintech-accent selection:text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fintech-accent to-emerald-400">
            Portfolio Tracker
            {showHateful8 && <span className="ml-3 text-sm font-bold px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/30 uppercase tracking-widest align-middle">Focus Mode: Hateful 8</span>}
          </h1>
          <p className="text-fintech-muted mt-2">Real-time insights and analytics.</p>
          {lastUpdated && (
            <p className="text-xs uppercase tracking-widest text-fintech-accent/60 mt-1 font-bold">
              Last Updated: {lastUpdated}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
          <div className="flex bg-fintech-card border border-fintech-border rounded-full p-1 shadow-inner order-1 sm:order-none">
            {Object.keys(currencySymbols).map(curr => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCurrency === curr
                  ? 'bg-fintech-accent text-white shadow-lg'
                  : 'text-fintech-muted hover:text-fintech-text'
                  }`}
              >
                {curr}
              </button>
            ))}
          </div>
          <div className="order-2 sm:order-none">
            {isLoaded && (
              user ? (
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 border border-fintech-border shadow-[0_0_15px_rgba(59,130,246,0.3)]" } }} />
              ) : (
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 bg-fintech-accent text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-all shadow-lg">
                    Sign Up
                  </button>
                </SignUpButton>
              )
            )}
          </div>
          <button
            onClick={() => setShowHateful8(!showHateful8)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-full font-medium transition-all duration-300 border order-3 sm:order-none ${showHateful8
              ? 'bg-fintech-accent border-fintech-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
              : 'bg-fintech-card border-fintech-border text-fintech-text hover:bg-fintech-border'
              }`}
          >
            Hateful 8 View
          </button>
          <div className="flex gap-2 order-4 sm:order-none">
            <button
              onClick={fetchPortfolio}
              className="p-2 rounded-full bg-fintech-card border border-fintech-border hover:bg-fintech-border transition-colors flex items-center justify-center text-fintech-text"
              title="Refresh Data"
            >
              <RefreshCcw size={20} className={loading ? 'animate-spin text-fintech-accent' : ''} />
            </button>
            <button
              onClick={() => setHideValues(!hideValues)}
              className="p-2 rounded-full bg-fintech-card border border-fintech-border hover:bg-fintech-border transition-colors flex items-center justify-center text-fintech-text"
              title={hideValues ? "Show Values" : "Hide Values"}
            >
              {hideValues ? <EyeOff size={20} className="text-fintech-accent" /> : <Eye size={20} />}
            </button>
          </div>
          <button
            onClick={() => {
              setFormData({ symbol: '', quantity: '1', avgBuyPrice: '', date: new Date().toISOString().split('T')[0] });
              setSearchResults([]);
              setShowModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-fintech-profit hover:bg-emerald-600 text-white rounded-full font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] order-5 sm:order-none"
          >
            <Plus size={18} /> New Stock
          </button>
        </div>
      </div>

      <div className="mb-10">
        <WisdomQuote />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-fintech-muted/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10">Total Capital Invested</p>
          <h2 className="text-3xl font-bold text-white relative z-10">
            {hideValues ? '****' : formatCurrency(totalCostBasis)}
          </h2>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-fintech-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10">Total Value</p>
          <h2 className="text-3xl font-bold text-white relative z-10">
            {hideValues ? '****' : formatCurrency(totalMarketValue)}
          </h2>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br from-${isProfit ? 'fintech-profit' : 'fintech-loss'}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10">Open Unrealized P/L</p>
          <div className="flex items-end gap-3 relative z-10">
            <h2 className={`text-3xl font-bold ${isProfit ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
              {hideValues ? '****' : `${isProfit ? '+' : ''}${formatCurrency(totalUnrealizedPL)}`}
            </h2>
            <div className={`flex items-center mb-1 text-sm font-semibold px-2 py-0.5 rounded-md ${isProfit ? 'bg-fintech-profit/20 text-fintech-profit' : 'bg-fintech-loss/20 text-fintech-loss'}`}>
              {isProfit ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {totalCostBasis > 0 ? ((totalUnrealizedPL / totalCostBasis) * 100).toFixed(2) : 0}%
            </div>
          </div>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10">Avg Portfolio Yield</p>
          <h2 className="text-3xl font-bold text-white relative z-10">
            {avgYield.toFixed(2)}%
          </h2>
        </div>
      </div>

      {loading && !holdings.length ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw size={32} className="animate-spin text-fintech-accent" />
        </div>
      ) : error ? (
        <div className="bg-fintech-loss/10 border border-fintech-loss text-fintech-loss p-4 rounded-xl flex items-center gap-3">
          <AlertCircle />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Table Area */}
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <h3 className="text-xl font-bold text-white uppercase tracking-widest opacity-80">
              Holdings
            </h3>
            <div className="relative column-dropdown-container">
              <button 
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-fintech-card border border-fintech-border rounded-lg text-sm text-fintech-muted hover:text-white transition-colors"
              >
                Columns <ChevronDown size={14} />
              </button>
              {showColumnDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-fintech-border rounded-xl shadow-2xl z-50 p-2">
                   {Object.keys(visibleColumns).map(col => (
                     <label key={col} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-300">
                       <input 
                         type="checkbox" 
                         checked={visibleColumns[col]} 
                         onChange={() => setVisibleColumns(prev => ({...prev, [col]: !prev[col]}))}
                         className="rounded bg-slate-800 border-fintech-border text-fintech-accent focus:ring-fintech-accent"
                       />
                       {col === 'index' ? '#' : col === 'unrealizedPL' ? 'Unrealized P/L' : col === 'yieldPct' ? 'Div Yield' : col === 'avgBuyPrice' ? 'Avg Price' : col === 'dailyChange' ? 'Daily Change' : col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                     </label>
                   ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-fintech-card border border-fintech-border rounded-2xl shadow-xl overflow-hidden mb-12">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-fintech-bg/50 border-b border-fintech-border text-fintech-muted text-sm uppercase tracking-wider">
                    {visibleColumns.index && <th className="p-5 font-semibold w-12 text-center hidden md:table-cell">#</th>}
                    {visibleColumns.symbol && <SortableHeader label="Symbol" sortKey="symbol" />}
                    {visibleColumns.quantity && <SortableHeader label="Shares" sortKey="quantity" alignCenter />}
                    {visibleColumns.avgBuyPrice && <SortableHeader label="Avg Price" sortKey="avgBuyPrice" alignRight />}
                    {visibleColumns.currentPrice && <SortableHeader label="Current Price" sortKey="currentPrice" alignRight />}
                    {visibleColumns.marketValue && <SortableHeader label="Market Value" sortKey="marketValue" alignRight />}
                    {visibleColumns.dailyChange && <SortableHeader label="Daily Change" sortKey="dailyChange" alignRight />}
                    {visibleColumns.unrealizedPL && <SortableHeader label="Unrealized P/L" sortKey="unrealizedPL" alignRight />}
                    {visibleColumns.yieldPct && <SortableHeader label="Div Yield" sortKey="yieldPct" alignRight className="hidden md:table-cell" />}
                    {visibleColumns.sector && <SortableHeader label="Sector" sortKey="sector" className="hidden md:table-cell" />}
                    {visibleColumns.industry && <SortableHeader label="Industry" sortKey="industry" />}
                    {visibleColumns.actions && <th className="p-5 font-semibold text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-fintech-border">
                    {sortedHoldings.length === 0 ? (
                      <tr>
                        <td colSpan={Object.values(visibleColumns).filter(v => v).length} className="p-8 text-center text-fintech-muted">
                          No holdings found. Click &quot;New Stock&quot; to start tracking.
                        </td>
                      </tr>
                    ) : (
                    sortedHoldings.map((h, i) => {
                      const isRowProfit = h.unrealizedPL >= 0;
                      const isExpanded = expandedRows[h.symbol] || false;

                      return (
                        <React.Fragment key={i}>
                          {/* Main Row */}
                          <tr
                            className={`hover:bg-fintech-bg/30 transition-colors group/row cursor-pointer ${isExpanded ? 'bg-fintech-bg/10' : ''}`}
                            onClick={() => toggleRow(h.symbol)}
                          >
                            {visibleColumns.index && <td className="p-5 text-center text-fintech-muted font-medium w-12 hidden md:table-cell">{i + 1}</td>}
                            {visibleColumns.symbol && <td className="p-5">
                              <div className="font-bold" style={{ color: isRowProfit ? 'rgba(138, 255, 213, 0.8)' : 'rgba(243, 129, 129, 0.8)' }}>{h.symbol}</div>
                              <div className="text-xs text-fintech-muted opacity-80 mt-0.5">{h.name}</div>
                            </td>}
                            {visibleColumns.quantity && <td className="p-5 text-center font-medium px-8">{hideValues ? '****' : h.quantity}</td>}
                            {visibleColumns.avgBuyPrice && <td className="p-5 text-right text-fintech-muted">{hideValues ? '****' : formatCurrency(convertValue(h.avgBuyPrice, h.currency))}</td>}
                            {visibleColumns.currentPrice && <td className="p-5 text-right font-medium">{formatCurrency(convertValue(h.currentPrice, h.currency))}</td>}
                            {visibleColumns.marketValue && <td className="p-5 text-right font-semibold text-white">
                              <div className="flex flex-col items-end">
                                <span>{hideValues ? '****' : formatCurrency(convertValue(h.marketValue || 0, h.currency))}</span>
                                <span className="text-sm font-medium text-fintech-accent mt-0.5 tracking-wide">
                                  {totalMarketValue > 0 && h.marketValue ? ((h.marketValue / totalMarketValue) * 100).toFixed(2) : '0.00'}%
                                </span>
                              </div>
                            </td>}
                            {visibleColumns.dailyChange && <td className={`p-5 text-right font-bold ${(h.dailyChange || 0) >= 0 ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
                              <div className="flex flex-col items-end">
                                <span>{hideValues ? '****' : `${(h.dailyChange || 0) >= 0 ? '+' : ''}${formatCurrency(convertValue((h.dailyChange || 0) * h.quantity, h.currency))}`}</span>
                                <span className="text-sm opacity-80">{(h.dailyChangePct || 0) >= 0 ? '+' : ''}{(h.dailyChangePct || 0).toFixed(2)}%</span>
                              </div>
                            </td>}
                            {visibleColumns.unrealizedPL && <td className={`p-5 text-right font-bold ${isRowProfit ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
                              <div className="flex flex-col items-end">
                                <span>{hideValues ? '****' : `${isRowProfit ? '+' : ''}${formatCurrency(convertValue(h.unrealizedPL || 0, h.currency))}`}</span>
                                <span className="text-sm opacity-80">{isRowProfit ? '+' : ''}{(h.unrealizedPLPercent || 0).toFixed(2)}%</span>
                              </div>
                            </td>}
                            {visibleColumns.yieldPct && <td className="p-5 text-right text-fintech-muted hidden md:table-cell">{(h.yieldPct || 0).toFixed(2)}%</td>}
                            {visibleColumns.sector && <td className="p-5 text-sm text-fintech-muted truncate max-w-[130px] hidden md:table-cell" title={h.sector}>{h.sector || 'Unknown'}</td>}
                            {visibleColumns.industry && <td className="p-5 text-sm text-fintech-muted truncate max-w-[130px]" title={h.industry}>{h.industry || 'Unknown'}</td>}
                            {visibleColumns.actions && <td className="p-5 text-center text-fintech-muted">
                              <button className="p-2 rounded-full hover:bg-fintech-border transition-colors">
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </td>}
                          </tr>

                          {/* Expanded Transaction Ledger Row */}
                          {isExpanded && (
                            <tr className="bg-fintech-bg/50 border-b border-fintech-border">
                              <td colSpan={Object.values(visibleColumns).filter(v => v).length} className="p-6">
                                <div className="rounded-xl border border-fintech-border bg-fintech-card overflow-hidden">
                                  {/* Sub-table Header */}
                                  <div className="bg-slate-800/50 px-4 py-3 border-b border-fintech-border flex justify-between items-center">
                                    <h4 className="text-sm font-semibold text-fintech-text tracking-wide uppercase">Transaction Ledger: {h.symbol}</h4>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setTxnFormActiveSymbol(txnFormActiveSymbol === h.symbol ? null : h.symbol); }}
                                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-fintech-accent/20 text-fintech-accent hover:bg-fintech-accent/30 transition-colors"
                                    >
                                      {txnFormActiveSymbol === h.symbol ? 'Cancel' : '+ Add Record'}
                                    </button>
                                  </div>

                                  {/* Transaction Form (Collapsible) */}
                                  {txnFormActiveSymbol === h.symbol && (
                                    <form onSubmit={(e) => handleAddTransaction(e, h.symbol)} className="p-4 border-b border-fintech-border bg-slate-800/30 flex flex-wrap gap-4 items-end">
                                      <div className="flex-1 min-w-[120px]">
                                        <label className="block text-xs font-medium text-fintech-muted mb-1">Type</label>
                                        <select
                                          value={txnForm.type}
                                          onChange={e => setTxnForm({ ...txnForm, type: e.target.value })}
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-fintech-accent"
                                        >
                                          <option value="BUY">Buy</option>
                                          <option value="SELL">Sell</option>
                                        </select>
                                      </div>
                                      <div className="flex-1 min-w-[120px]">
                                        <label className="block text-xs font-medium text-fintech-muted mb-1">Date</label>
                                        <input
                                          type="date" required
                                          value={txnForm.date}
                                          onChange={e => setTxnForm({ ...txnForm, date: e.target.value })}
                                          onClick={(e) => { try { (e.target as HTMLInputElement).showPicker() } catch (err) { } }}
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-fintech-accent text-slate-200 cursor-pointer"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-[120px]">
                                        <label className="block text-xs font-medium text-fintech-muted mb-1">Shares</label>
                                        <input
                                          type="number" step="any" required
                                          value={txnForm.quantity}
                                          onChange={e => setTxnForm({ ...txnForm, quantity: e.target.value })}
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-fintech-accent placeholder-slate-500" placeholder="e.g. 5.5"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-[120px]">
                                        <label className="block text-xs font-medium text-fintech-muted mb-1">Price</label>
                                        <input
                                          type="number" step="any" required
                                          value={txnForm.price}
                                          onChange={e => setTxnForm({ ...txnForm, price: e.target.value })}
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-fintech-accent placeholder-slate-500" placeholder="e.g. 150.00"
                                        />
                                      </div>
                                      <button
                                        type="submit" disabled={submitLoading}
                                        className="bg-fintech-accent hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 h-[38px] min-w-[100px]"
                                      >
                                        {submitLoading ? 'Saving...' : 'Save'}
                                      </button>
                                    </form>
                                  )}

                                  {/* Transaction List */}
                                  <table className="w-full text-sm">
                                    <thead className="text-slate-400 bg-slate-900/50">
                                      <tr>
                                        <th className="py-2 px-4 font-medium text-left">Date</th>
                                        <th className="py-2 px-4 font-medium text-left">Action</th>
                                        <th className="py-2 px-4 font-medium text-right">Shares</th>
                                        <th className="py-2 px-4 font-medium text-right">Price</th>
                                        <th className="py-2 px-4 font-medium text-right border-l border-slate-700/50 px-4">Value</th>
                                        <th className="py-2 px-4 font-medium text-center w-12"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                      {h.transactions && h.transactions.length > 0 ? h.transactions.map((t: any) => {
                                        if (editingTxnId === t.id) {
                                          return (
                                            <tr key={t.id} className="bg-slate-800/60">
                                              <td colSpan={6} className="p-0">
                                                <form onSubmit={(e) => handleEditTransactionSubmit(e, h.symbol)} className="flex items-center gap-2 p-2">
                                                  <input
                                                    type="date" required
                                                    value={editTxnForm.date}
                                                    onChange={e => setEditTxnForm({ ...editTxnForm, date: e.target.value })}
                                                    onClick={(e) => { try { (e.target as HTMLInputElement).showPicker() } catch (err) { } }}
                                                    className="w-[120px] bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:ring-1 focus:ring-fintech-accent outline-none cursor-pointer"
                                                  />
                                                  <select
                                                    value={editTxnForm.type}
                                                    onChange={e => setEditTxnForm({ ...editTxnForm, type: e.target.value })}
                                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-fintech-accent outline-none"
                                                  >
                                                    <option value="BUY">BUY</option>
                                                    <option value="SELL">SELL</option>
                                                  </select>
                                                  <input
                                                    type="number" step="any" required placeholder="Shares"
                                                    value={editTxnForm.quantity}
                                                    onChange={e => setEditTxnForm({ ...editTxnForm, quantity: e.target.value })}
                                                    className="flex-1 min-w-[70px] bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-fintech-accent outline-none text-right"
                                                  />
                                                  <input
                                                    type="number" step="any" required placeholder="Price"
                                                    value={editTxnForm.price}
                                                    onChange={e => setEditTxnForm({ ...editTxnForm, price: e.target.value })}
                                                    className="flex-1 min-w-[70px] bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-fintech-accent outline-none text-right"
                                                  />
                                                  <div className="flex gap-1 items-center px-2">
                                                    <button type="submit" disabled={submitLoading} className="px-2 py-1 bg-fintech-profit hover:bg-emerald-600 text-white text-xs rounded transition-colors whitespace-nowrap">Save</button>
                                                    <button type="button" onClick={() => setEditingTxnId(null)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors whitespace-nowrap">Cancel</button>
                                                  </div>
                                                </form>
                                              </td>
                                            </tr>
                                          );
                                        }

                                        return (
                                          <tr key={t.id} className="hover:bg-slate-800/40">
                                            <td className="py-2 px-4 text-slate-300">{new Date(t.date).toLocaleDateString('en-GB')}</td>
                                            <td className="py-2 px-4 font-medium">
                                              <span className={`px-2 py-0.5 rounded text-xs ${t.type === 'BUY' ? 'bg-fintech-profit/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                {t.type}
                                              </span>
                                            </td>
                                            <td className="py-2 px-4 text-right text-slate-300">{hideValues ? '****' : t.quantity}</td>
                                            <td className="py-2 px-4 text-right text-slate-400">{hideValues ? '****' : formatCurrency(convertValue(t.price, h.currency))}</td>
                                            <td className="py-2 px-4 text-right text-slate-300 border-l border-slate-700/50 font-medium">
                                              {hideValues ? '****' : formatCurrency(convertValue(t.quantity * t.price, h.currency))}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                              <button
                                                onClick={() => {
                                                  setEditingTxnId(t.id);
                                                  setEditTxnForm({ type: t.type, quantity: t.quantity.toString(), price: t.price.toString(), date: t.date });
                                                }}
                                                className="text-slate-500 hover:text-fintech-accent transition-colors p-1"
                                                title="Edit Record"
                                              >
                                                <Edit2 size={14} />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteTransaction(h.symbol, t.id)}
                                                className="text-slate-500 hover:text-rose-400 transition-colors p-1 ml-1"
                                                title="Delete Record"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      }) : (
                                        <tr>
                                          <td colSpan={6} className="py-4 text-center text-slate-500 italic">No transactions found for {h.symbol}</td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <PerformanceChart 
            data={performanceData.map(d => ({ ...d, value: convertValue(d.value, 'USD') }))} 
            hideValues={hideValues} 
            currencySymbol={currencySymbols[selectedCurrency] || '$'}
          />
          
          <AllocationCharts holdings={sortedHoldings} />

          {/* Closed Positions Section */}
          {closedHoldings.length > 0 && (
            <div className="mt-12 backdrop-blur-md">
              <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest opacity-80 border-b border-fintech-border pb-3">
                Historical Activity (Closed)
              </h3>
              <div className="bg-fintech-card/50 border border-fintech-border/30 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/40 border-b border-fintech-border text-fintech-muted text-xs uppercase tracking-wider">
                        <th className="p-5 font-medium w-12 text-center">#</th>
                        <th className="p-5 font-medium">Symbol</th>
                        <th className="p-5 font-medium text-right">Trades Executed</th>
                        <th className="p-5 font-medium text-center">Industry</th>
                        <th className="p-5 font-medium text-right">Realized P/L</th>
                        <th className="p-5 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fintech-border/30">
                      {closedHoldings.map((h, i) => {
                        const isExpanded = expandedRows[h.symbol] || false;
                        const isClosedProfit = h.realizedPL >= 0;

                        return (
                          <React.Fragment key={`closed-${i}`}>
                            <tr
                              className={`hover:bg-fintech-bg/20 transition-colors group/row cursor-pointer ${isExpanded ? 'bg-fintech-bg/10' : ''}`}
                              onClick={() => toggleRow(h.symbol)}
                            >
                              <td className="p-5 text-center text-fintech-muted opacity-50 text-sm w-12">{i + 1}</td>
                              <td className="p-5">
                                <div className="font-bold text-white opacity-80">{h.symbol}</div>
                                <div className="text-xs text-fintech-muted opacity-60 mt-0.5">{h.name}</div>
                              </td>
                              <td className="p-5 text-right font-medium text-slate-400">
                                {h.transactions?.length || 0}
                              </td>
                              <td className="p-5 text-center text-sm text-fintech-muted truncate max-w-[130px] opacity-70" title={h.industry}>
                                {h.industry || 'Unknown'}
                              </td>
                              <td className={`p-5 text-right font-bold text-lg tracking-wide ${isClosedProfit ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
                                <div className="flex flex-col items-end">
                                  <span>{hideValues ? '****' : formatCurrency(convertValue(h.realizedPL || 0, h.currency))}</span>
                                  <span className="text-[10px] uppercase opacity-70 mt-0.5 text-fintech-muted">Final Yield</span>
                                </div>
                              </td>
                              <td className="p-5 text-center text-fintech-muted">
                                <button className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </td>
                            </tr>
                            {/* Expanded Transaction Ledger Row for Closed Positions */}
                            {isExpanded && (
                              <tr className="bg-slate-900/60 border-b border-fintech-border/30">
                                <td colSpan={6} className="p-6">
                                  <div className="rounded-xl border border-fintech-border/30 bg-slate-900/40 overflow-hidden">
                                    <div className="bg-slate-800/30 px-4 py-3 border-b border-fintech-border flex justify-between items-center opacity-80">
                                      <h4 className="text-sm font-semibold text-fintech-text tracking-wide uppercase">Transaction Ledger: {h.symbol}</h4>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setTxnFormActiveSymbol(txnFormActiveSymbol === h.symbol ? null : h.symbol); }}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-fintech-accent/10 text-fintech-accent hover:bg-fintech-accent/20 transition-colors"
                                      >
                                        + Log Trade
                                      </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm text-left opacity-90">
                                        <thead className="bg-fintech-bg/30 text-fintech-muted border-b border-fintech-border">
                                          <tr>
                                            <th className="py-2 px-4 font-medium text-left">Date</th>
                                            <th className="py-2 px-4 font-medium text-left">Action</th>
                                            <th className="py-2 px-4 font-medium text-right">Shares</th>
                                            <th className="py-2 px-4 font-medium text-right">Price</th>
                                            <th className="py-2 px-4 font-medium text-right border-l border-slate-700/50 px-4">Value</th>
                                            <th className="py-2 px-4 font-medium text-center w-12"></th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40">
                                          {txnFormActiveSymbol === h.symbol && (
                                            <tr className="bg-fintech-bg/80 animate-in fade-in slide-in-from-top-2 duration-200">
                                              <td colSpan={6} className="p-4 border-b border-fintech-accent/20">
                                                <form className="flex gap-4 items-end max-w-3xl" onSubmit={(e) => { e.preventDefault(); handleTxnSubmit(h.symbol); }}>
                                                  <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs font-medium text-fintech-muted mb-1">Type</label>
                                                    <select
                                                      value={txnForm.type}
                                                      onChange={e => setTxnForm({ ...txnForm, type: e.target.value })}
                                                      className="w-full bg-fintech-card border border-fintech-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-fintech-accent text-sm"
                                                    >
                                                      <option value="BUY">BUY</option>
                                                      <option value="SELL">SELL</option>
                                                    </select>
                                                  </div>
                                                  <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs font-medium text-fintech-muted mb-1">Date</label>
                                                    <input
                                                      type="date" required
                                                      value={txnForm.date}
                                                      onChange={e => setTxnForm({ ...txnForm, date: e.target.value })}
                                                      onClick={(e) => { try { (e.target as HTMLInputElement).showPicker() } catch (err) { } }}
                                                      className="w-full bg-fintech-card border border-fintech-border rounded-lg px-3 py-2 text-fintech-muted focus:outline-none focus:ring-1 focus:ring-fintech-accent text-sm cursor-pointer"
                                                    />
                                                  </div>
                                                  <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs font-medium text-fintech-muted mb-1">Shares</label>
                                                    <input
                                                      type="number" required step="any"
                                                      value={txnForm.quantity}
                                                      onChange={e => setTxnForm({ ...txnForm, quantity: e.target.value })}
                                                      className="w-full bg-fintech-card border border-fintech-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-fintech-accent text-sm"
                                                      placeholder="5.5"
                                                    />
                                                  </div>
                                                  <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-xs font-medium text-fintech-muted mb-1">Price</label>
                                                    <input
                                                      type="number" required step="any"
                                                      value={txnForm.price}
                                                      onChange={e => setTxnForm({ ...txnForm, price: e.target.value })}
                                                      className="w-full bg-fintech-card border border-fintech-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-fintech-accent text-sm"
                                                      placeholder="120.00"
                                                    />
                                                  </div>
                                                  <button type="submit" disabled={submitLoading} className="bg-fintech-accent hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 h-[38px] min-w-[100px]">
                                                    {submitLoading ? <span className="opacity-70">...</span> : 'Save'}
                                                  </button>
                                                </form>
                                              </td>
                                            </tr>
                                          )}

                                          {h.transactions && h.transactions.length > 0 ? h.transactions.map((t: any) => {
                                            if (editingTxnId === t.id) {
                                              return (
                                                <tr key={t.id} className="bg-fintech-bg/50">
                                                  <td className="py-2 px-4">
                                                    <input type="date" required value={editTxnForm.date} onChange={e => setEditTxnForm({ ...editTxnForm, date: e.target.value })} className="min-w-[120px] bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-fintech-accent outline-none text-slate-300 w-full cursor-pointer" />
                                                  </td>
                                                  <td className="py-2 px-4">
                                                    <select value={editTxnForm.type} onChange={e => setEditTxnForm({ ...editTxnForm, type: e.target.value })} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-fintech-accent outline-none w-full">
                                                      <option value="BUY">BUY</option>
                                                      <option value="SELL">SELL</option>
                                                    </select>
                                                  </td>
                                                  <td className="py-2 px-4 text-right">
                                                    <input type="number" required step="any" value={editTxnForm.quantity} onChange={e => setEditTxnForm({ ...editTxnForm, quantity: e.target.value })} className="flex-1 min-w-[70px] bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-fintech-accent outline-none text-right" />
                                                  </td>
                                                  <td className="py-2 px-4 text-right">
                                                    <input type="number" required step="any" value={editTxnForm.price} onChange={e => setEditTxnForm({ ...editTxnForm, price: e.target.value })} className="flex-1 min-w-[70px] bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-fintech-accent outline-none text-right" />
                                                  </td>
                                                  <td className="py-2 px-4 border-l border-slate-700/50">
                                                    <div className="flex justify-end pr-2 text-xs text-slate-500 italic">Editing...</div>
                                                  </td>
                                                  <td className="py-2 px-4 text-center">
                                                    <div className="flex gap-1 justify-center">
                                                      <button onClick={() => setEditingTxnId(null)} className="text-slate-500 hover:text-white px-1">✕</button>
                                                      <button onClick={() => handleEditSubmit(h.symbol, t.id)} className="text-fintech-accent hover:text-blue-400 font-bold px-1">✓</button>
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            }

                                            return (
                                              <tr key={t.id} className="hover:bg-slate-800/40">
                                                <td className="py-2 px-4 text-slate-300">{new Date(t.date).toLocaleDateString('en-GB')}</td>
                                                <td className="py-2 px-4 font-medium">
                                                  <span className={`px-2 py-0.5 rounded text-xs ${t.type === 'BUY' ? 'bg-fintech-profit/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {t.type}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-4 text-right text-slate-300">{t.quantity}</td>
                                                <td className="py-2 px-4 text-right text-slate-400">{hideValues ? '****' : formatCurrency(convertValue(t.price, h.currency))}</td>
                                                <td className={`py-2 px-4 text-right border-l border-slate-700/50 font-medium ${t.type === 'BUY' ? 'text-fintech-loss' : 'text-fintech-profit'}`}>
                                                  {hideValues ? '****' : `${t.type === 'BUY' ? '-' : '+'}${formatCurrency(convertValue(t.quantity * t.price, h.currency))}`}
                                                </td>
                                                <td className="py-2 px-4 text-center">
                                                  <button
                                                    onClick={() => {
                                                      setEditingTxnId(t.id);
                                                      setEditTxnForm({ type: t.type, quantity: t.quantity.toString(), price: t.price.toString(), date: t.date });
                                                    }}
                                                    className="text-slate-500 hover:text-fintech-accent transition-colors p-1"
                                                    title="Edit Record"
                                                  >
                                                    <Edit2 size={14} />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteTransaction(h.symbol, t.id)}
                                                    className="text-slate-500 hover:text-rose-400 transition-colors p-1 ml-1"
                                                    title="Delete Record"
                                                  >
                                                    <Trash2 size={14} />
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          }) : (
                                            <tr>
                                              <td colSpan={6} className="py-4 text-center text-slate-500 italic">No transactions found for {h.symbol}</td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Add Modal (For fresh stocks only) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fintech-card border border-fintech-border w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all">
            <h2 className="text-2xl font-bold text-white mb-6">Track New Stock</h2>
            <form onSubmit={handleAddFreshHolding} className="space-y-4">
              <div className="relative symbol-search-container">
                <label className="block text-sm font-medium text-fintech-muted mb-1">Symbol (e.g. MSFT)</label>
                <div className="relative">
                  <input
                    type="text" required
                    value={formData.symbol}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setFormData({ ...formData, symbol: val });
                      handleSymbolSearch(val);
                    }}
                    onFocus={() => formData.symbol && setShowDropdown(true)}
                    className="w-full bg-fintech-bg border border-fintech-border rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent transition-all uppercase"
                    placeholder="MSFT"
                  />
                  <Search className="absolute left-4 top-3.5 text-fintech-muted" size={18} />
                </div>

                {showDropdown && (searchResults.length > 0 || searchLoading) && (
                  <div className="absolute w-full mt-2 bg-slate-900 border border-fintech-border rounded-xl shadow-2xl z-[60] max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {searchLoading ? (
                      <div className="p-4 flex items-center justify-center gap-2 text-fintech-muted">
                        <RefreshCw size={16} className="animate-spin text-fintech-accent" />
                        <span className="text-sm">Searching...</span>
                      </div>
                    ) : (
                      searchResults.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectSymbol(s)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-fintech-accent/10 flex items-center justify-center shrink-0">
                            <Building2 size={20} className="text-fintech-accent" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{s.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-medium uppercase">{s.exchange}</span>
                            </div>
                            <div className="text-xs text-fintech-muted truncate">{s.name}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-fintech-muted mb-1">Date</label>
                <input
                  type="date" required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  onClick={(e) => { try { (e.target as HTMLInputElement).showPicker() } catch (err) { } }}
                  className="w-full bg-fintech-bg border border-fintech-border rounded-xl px-4 py-3 text-fintech-muted focus:outline-none focus:ring-2 focus:ring-fintech-accent transition-all cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-fintech-muted mb-1">Buy Quantity</label>
                  <input
                    type="number" required step="any"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-fintech-bg border border-fintech-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent transition-all"
                    placeholder="10.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-fintech-muted mb-1">Buy Price</label>
                  <input
                    type="number" required step="any"
                    value={formData.avgBuyPrice}
                    onChange={e => setFormData({ ...formData, avgBuyPrice: e.target.value })}
                    className="w-full bg-fintech-bg border border-fintech-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent transition-all"
                    placeholder="150.00"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-fintech-text bg-fintech-bg border border-fintech-border hover:bg-fintech-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-fintech-accent hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {submitLoading ? <RefreshCw size={20} className="animate-spin" /> : 'Start Tracking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* News Ticker */}
      <TickerTape items={tickerItems} />
      {/* Conversion Prompt Modal */}
      {showSignupPrompt && !user && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-fintech-card border border-fintech-accent/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <div className="w-20 h-20 bg-fintech-accent/10 rounded-full blur-3xl absolute -top-10 -right-10"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-fintech-accent to-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform -rotate-6">
                <TrendingUp size={40} className="text-white" />
              </div>
              
              <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
                Secure Your Progress!
              </h2>
              
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                You've started building a great portfolio! Sign up now to securely store your data in the cloud and access your insights from any device.
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                <SignUpButton mode="modal">
                  <button className="w-full py-4 bg-fintech-accent hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-[0_10px_20px_rgba(59,130,246,0.3)] text-lg">
                    Create My Free Account
                  </button>
                </SignUpButton>
                <p className="text-slate-500 text-xs mt-2 italic">
                  Don't worry, your local stocks will be automatically migrated to your new account.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
