"use client";

import React, { useEffect, useState } from 'react';
import AllocationCharts from '@/components/AllocationCharts';
import PerformanceChart from '@/components/PerformanceChart';
import TickerTape from '@/components/TickerTape';
import WisdomQuote from '@/components/WisdomQuote';
import { 
  Building2, ChevronDown, ChevronUp, LogOut, Search, TrendingDown, TrendingUp, X, Check,
  ArrowUpDown, RefreshCw, Plus, Star, AlertCircle, RefreshCcw, Trash2, Edit2, Eye, EyeOff, Coins, Info, Sparkles
} from 'lucide-react';
import { useUser, SignUpButton, UserButton } from '@clerk/nextjs';
import { useConversionTimer } from '@/hooks/useConversionTimer';

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B', '#14B8A6', '#06B6D4',
  '#EAB308', '#84CC16', '#22C55E', '#0EA5E9', '#D946EF', '#9333EA', '#F97316', '#EF4444', '#10B981'
];

const COMPANY_EXPLANATIONS: Record<string, string> = {
  STRC: "High-yield preferred stock backed by massive corporate dollar and Bitcoin reserves. It delivers elite, predictable cash flow independent of traditional market indices.",
  NVDA: "The premier architect of advanced AI microchips. They design the complex intellectual brainpower fueling the global artificial intelligence, data center, and computing revolution.",
  PLTR: "Elite data-analytics software provider securing critical military defense operations and massive corporate enterprise infrastructure. Their sticky government contracts create an ironclad economic moat.",
  COIN: "The leading regulated cryptocurrency exchange. It operates as the primary institutional gateway capturing massive transaction fees on mainstream digital asset volume.",
  CRCL: "Stablecoin pioneer issuing USDC. They profit immensely by capturing high interest yields on the traditional cash reserves backing their circulating digital dollars.",
  GOLD: "A massive senior precious metals miner. It serves as a classic physical asset hedge, protecting portfolio purchasing power against systemic inflation.",
  OXY: "Major domestic oil and gas producer backed heavily by Warren Buffett. They capture traditional energy demand while scaling cutting-edge industrial carbon-capture tech.",
  NEE: "The premier global green utility. It provides a rock-solid defensive shield, spinning off exceptionally safe, highly predictable dividend cash flows regardless of macro economic conditions.",
  IRM: "A specialized real estate trust protecting physical data storage and corporate archives. Their highly secure, long-term tenant leases support a remarkably durable dividend payout.",
  TSM: "The world's dominant semiconductor foundry. They physically manufacture the actual advanced microchips designed by big tech giants, completely controlling global hardware production infrastructure.",
  AVGO: "An infrastructure semiconductor powerhouse. They dominate the specialized chips and networking hardware required to physically link massive AI data servers together globally.",
  AMZN: "Unrivaled e-commerce giant structurally backed by AWS. Their high-margin cloud computing network dominance completely funds aggressive retail and next-generation logistics expansions worldwide.",
  VRTX: "A biotech juggernaut carrying zero debt. They hold an ironclad global monopoly on life-saving cystic fibrosis therapies, generating completely recession-proof revenue.",
  AAPL: "The world's premier consumer electronics juggernaut. They command an unbreakable ecosystem of premium hardware and highly sticky subscription services, generating massive, recurring global cash flows.",
  MSFT: "Unrivaled enterprise software titan structurally backed by Azure cloud. Their mission-critical operating systems and AI infrastructure create an ironclad moat capturing massive global corporate spending.",
  MICROSOFT: "Unrivaled enterprise software titan structurally backed by Azure cloud. Their mission-critical operating systems and AI infrastructure create an ironclad moat capturing massive global corporate spending.",
  INTEL: "A foundational American semiconductor pioneer. They control massive legacy chip manufacturing infrastructure while aggressively attempting to reclaim next-generation foundry dominance for Western technological independence.",
  INTC: "A foundational American semiconductor pioneer. They control massive legacy chip manufacturing infrastructure while aggressively attempting to reclaim next-generation foundry dominance for Western technological independence.",
  ORCL: "The premier legacy database infrastructure giant. They secure massive corporate data systems while rapidly expanding cutting-edge cloud infrastructure to power next-generation global AI workloads.",
  STRK: "A dominant global medical technology powerhouse. They provide critical, life-saving surgical equipment and advanced orthopedics, securing completely recession-proof revenue from the global healthcare system.",
  MSTR: "The ultimate corporate Bitcoin treasury vehicle. They brilliantly leverage enterprise software cash flows and cheap institutional debt to aggressively acquire massive digital asset reserves.",
  MSTY: "An aggressive high-yield options strategy fund. It writes complex covered calls on MSTR volatility, designed to capture extreme price swings and spin off massive monthly income.",
  KRYS: "An elite commercial-stage biotech innovator. They hold proprietary, life-saving gene therapies targeting ultra-rare diseases, capturing extreme pricing power and generating completely recession-proof revenue streams.",
  RKLB: "The premier dedicated small-satellite launch provider. They dominate specialized orbital infrastructure deployment and spacecraft manufacturing, physically building the next generation of the global space economy.",
  NET: "The world's dominant cloud edge network. They secure critical global internet infrastructure and massive corporate enterprise systems, providing an unbreakable defensive shield against cyber threats.",
  TSLA: "An unrivaled global clean energy juggernaut. They completely dominate the physical manufacturing of advanced robotics, battery infrastructure, and autonomous artificial intelligence transportation networks.",
  ASML: "The absolute monopoly in advanced semiconductor lithography. They build the incredibly complex, irreplaceable extreme ultraviolet machines required to physically manufacture the world's most advanced microchips.",
  MU: "A premier global memory chip powerhouse. They manufacture the critical, high-performance DRAM and NAND storage infrastructure physically required to power massive artificial intelligence data centers.",
  VRT: "An elite data center infrastructure provider. They design the massive liquid cooling systems and power management grids physically required to keep the global AI supercomputing revolution running safely.",
  B: "A diversified industrial manufacturing powerhouse. They design critical engineered components for aerospace and medical systems, capturing rock-solid, highly predictable cash flows from global industrial expansion."
};


export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { showSignupPrompt, startTimer } = useConversionTimer();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideValues, setHideValues] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [watchlistInput, setWatchlistInput] = useState('');
  
  // Trinity Screener state
  const [screenerTabActive, setScreenerTabActive] = useState(false);
  const [activeScreenerPool, setActiveScreenerPool] = useState<'trinity'|'trending'|'smallcap'>('trinity');
  const [screenerResults, setScreenerResults] = useState<any[]>([]);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerError, setScreenerError] = useState<string | null>(null);
  
  const [trendingResults, setTrendingResults] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  
  const [smallcapResults, setSmallcapResults] = useState<any[]>([]);
  const [smallcapLoading, setSmallcapLoading] = useState(false);
  const [smallcapError, setSmallcapError] = useState<string | null>(null);
  const [explanationSymbol, setExplanationSymbol] = useState<string | null>(null);
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);
  
  useEffect(() => {
    setIsExplanationExpanded(false);
  }, [explanationSymbol]);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [aiModelView, setAiModelView] = useState<'garp' | 'moat' | 'value' | 'confluence' | 'trinity'>('confluence');

  // Portfolio Multi-Select State
  const [selectedPortfolioSymbols, setSelectedPortfolioSymbols] = useState<string[]>([]);
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false);

  // Column Visibility State
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    index: true,
    symbol: true,
    quantity: true,
    avgBuyPrice: true,
    currentPrice: true,
    portfolioPct: true,
    marketValue: true,
    dailyChange: true,
    unrealizedPL: true,
    aiScore: true,
    yieldPct: false,
    sector: false,
    industry: false,
    actions: true
  });

  const totalPossibleColumns = Object.keys(visibleColumns).length;
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const hasHiddenColumns = visibleCount < totalPossibleColumns;

  // Drag and drop column state
  const defaultColumnOrder = ['symbol', 'quantity', 'avgBuyPrice', 'currentPrice', 'portfolioPct', 'marketValue', 'dailyChange', 'unrealizedPL', 'aiScore', 'yieldPct', 'sector', 'industry'];
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);
  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('portfolioColumnOrder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === defaultColumnOrder.length) {
          setColumnOrder(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const handleDragStart = (e: React.DragEvent, col: string) => {
    setDraggedCol(col);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', col);
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDragOverCol(col);
  };

  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetCol) {
      setDraggedCol(null);
      setDragOverCol(null);
      return;
    }
    
    setColumnOrder(prev => {
      const newOrder = [...prev];
      const dragIndex = newOrder.indexOf(draggedCol);
      const targetIndex = newOrder.indexOf(targetCol);
      
      newOrder.splice(dragIndex, 1);
      newOrder.splice(targetIndex, 0, draggedCol);
      
      localStorage.setItem('portfolioColumnOrder', JSON.stringify(newOrder));
      return newOrder;
    });
    
    setDraggedCol(null);
    setDragOverCol(null);
  };

  const getColumnStyle = (isVisible: boolean, baseMinWidth: string = '80px', baseWidth: string = 'auto') => {
    return {
      width: isVisible ? baseWidth : '0px',
      minWidth: isVisible ? baseMinWidth : '0px',
      maxWidth: isVisible ? '500px' : '0px',
      opacity: isVisible ? 1 : 0,
      paddingLeft: isVisible ? '20px' : '0px',
      paddingRight: isVisible ? '20px' : '0px',
      paddingTop: isVisible ? '20px' : '0px',
      paddingBottom: isVisible ? '20px' : '0px',
      overflow: 'hidden',
      whiteSpace: 'nowrap' as const,
      pointerEvents: isVisible ? ('auto' as const) : ('none' as const),
      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      borderWidth: isVisible ? '' : '0px',
      display: isVisible ? undefined : 'none'
    };
  };

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
  const [isSymbolSelected, setIsSymbolSelected] = useState(false);
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
    const localWatchlist = JSON.parse(localStorage.getItem('ghost_watchlist') || '[]');
    for (const w of localWatchlist) {
      try {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', symbol: w.symbol })
        });
      } catch(err) {}
    }
    localStorage.removeItem('ghost_watchlist');
    
    fetchPortfolio();
    fetchWatchlist();
  };

  useEffect(() => {
    if (user && isLoaded && (localStorage.getItem('ghost_holdings') || localStorage.getItem('ghost_watchlist'))) {
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
                  explanation: quote.explanation || "",
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

  const fetchWatchlist = async () => {
    try {
      if (user) {
        const res = await fetch('/api/watchlist');
        if (res.ok) {
          const data = await res.json();
          setWatchlist(data.watchlist || []);
        }
      } else {
        const localWatchlist = JSON.parse(localStorage.getItem('ghost_watchlist') || '[]');
        if (localWatchlist.length > 0) {
          const symbols = localWatchlist.map((w: any) => w.symbol).join(',');
          const quoteRes = await fetch(`/api/market-data?symbols=${symbols}`);
          if (quoteRes.ok) {
            const marketData = await quoteRes.json();
            const quotes = Array.isArray(marketData) ? marketData : (marketData.results || []);
            const updated = localWatchlist.map((w: any) => {
              const quote = quotes.find((m: any) => m.symbol === w.symbol);
              if (quote) {
                let sinceAddedChange = 0;
                let sinceAddedChangePct = 0;
                if (w.addedPrice && quote.price > 0) {
                  sinceAddedChange = quote.price - w.addedPrice;
                  sinceAddedChangePct = (sinceAddedChange / w.addedPrice) * 100;
                }
                return {
                  ...w,
                  price: quote.price,
                  change: quote.change,
                  changeAbs: quote.changeAbs,
                  name: quote.name,
                  currency: quote.currency,
                  sector: quote.sector || "Unknown",
                  industry: quote.industry || "Unknown",
                  sinceAddedChange,
                  sinceAddedChangePct
                };
              }
              return w;
            });
            setWatchlist(updated);
          }
        } else {
          setWatchlist([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchlistInput) return;
    setSubmitLoading(true);
    try {
      if (user) {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', symbol: watchlistInput })
        });
      } else {
        const localWatchlist = JSON.parse(localStorage.getItem('ghost_watchlist') || '[]');
        if (!localWatchlist.find((w: any) => w.symbol === watchlistInput.toUpperCase())) {
          let addedPrice = null;
          try {
            const qRes = await fetch(`/api/market-data?symbols=${watchlistInput.toUpperCase()}`);
            if (qRes.ok) {
               const data = await qRes.json();
               addedPrice = data.results[0]?.price || null;
            }
          } catch(e) {}

          localWatchlist.push({ 
            id: 'ghost-w-' + Date.now(), 
            symbol: watchlistInput.toUpperCase(),
            addedPrice
          });
          localStorage.setItem('ghost_watchlist', JSON.stringify(localWatchlist));
        }
      }
      await fetchWatchlist();
      setShowWatchlistModal(false);
      setWatchlistInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (idOrSymbol: string) => {
    try {
      if (user) {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove', [idOrSymbol.startsWith('ghost') ? 'symbol' : 'id']: idOrSymbol })
        });
      } else {
        let localWatchlist = JSON.parse(localStorage.getItem('ghost_watchlist') || '[]');
        localWatchlist = localWatchlist.filter((w: any) => w.id !== idOrSymbol && w.symbol !== idOrSymbol);
        localStorage.setItem('ghost_watchlist', JSON.stringify(localWatchlist));
      }
      await fetchWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStar = async (item: any) => {
    try {
      const action = item.isStarred ? 'unstar' : 'star';
      if (action === 'star') {
        const starredCount = watchlist.filter(w => w.isStarred).length;
        if (starredCount >= 3) {
          setError('You can only star up to 3 stocks in your watchlist.');
          setTimeout(() => setError(null), 3000);
          return;
        }
      }
      
      if (user) {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, [item.id ? 'id' : 'symbol']: item.id || item.symbol })
        });
        if (!res.ok) {
           const data = await res.json();
           setError(data.error || 'Failed to update star');
           setTimeout(() => setError(null), 3000);
           return;
        }
      } else {
        let localWatchlist = JSON.parse(localStorage.getItem('ghost_watchlist') || '[]');
        localWatchlist = localWatchlist.map((w: any) => {
          if ((item.id && w.id === item.id) || w.symbol === item.symbol) {
             return { ...w, isStarred: !item.isStarred };
          }
          return w;
        });
        localStorage.setItem('ghost_watchlist', JSON.stringify(localWatchlist));
      }
      await fetchWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  const runTrinityScreener = async () => {
    setScreenerLoading(true);
    setScreenerError(null);
    setScreenerResults([]);
    try {
      const res = await fetch('/api/trinity-screener', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScreenerResults(data.results || []);
      } else {
        const err = await res.json();
        setScreenerError(err.error || 'Failed to run screener');
      }
    } catch (err) {
      console.error(err);
      setScreenerError('Network error while running screener');
    } finally {
      setScreenerLoading(false);
    }
  };

  const runTrendingScreener = async () => {
    if (trendingResults.length > 0) return; // Don't refetch if we already have them
    
    setTrendingLoading(true);
    setTrendingError(null);
    try {
      const res = await fetch('/api/trending-screener', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTrendingResults(data.results || []);
      } else {
        const err = await res.json();
        setTrendingError(err.error || 'Failed to run trending screener');
      }
    } catch (err) {
      console.error(err);
      setTrendingError('Network error while running trending screener');
    } finally {
      setTrendingLoading(false);
    }
  };

  const runSmallcapScreener = async () => {
    if (smallcapResults.length > 0) return;
    
    setSmallcapLoading(true);
    setSmallcapError(null);
    try {
      const res = await fetch('/api/smallcap-screener', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSmallcapResults(data.results || []);
      } else {
        const err = await res.json();
        setSmallcapError(err.error || 'Failed to run small-cap screener');
      }
    } catch (err) {
      console.error(err);
      setSmallcapError('Network error while running small-cap screener');
    } finally {
      setSmallcapLoading(false);
    }
  };

  const runAiAnalysis = async () => {
    const symbols = Array.from(new Set([...watchlist.map(w => w.symbol), ...holdings.map(h => h.symbol)]));
    if (symbols.length === 0) return;
    
    const expectedNames: Record<string, string> = {};
    watchlist.forEach(w => { if(w.name) expectedNames[w.symbol] = w.name; });
    holdings.forEach(h => { if(h.name) expectedNames[h.symbol] = h.name; });

    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, expectedNames })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResults(data.results || []);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to run AI analysis');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
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
    fetchWatchlist();
    fetchRates();
    fetchMarketData();
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (selectedPortfolioSymbols.length > 0) {
      fetchPerformance(selectedPortfolioSymbols);
    } else {
      fetchPerformance();
    }
  }, [selectedPortfolioSymbols, isLoaded, user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.symbol-search-container')) {
        setShowDropdown(false);
      }
      if (!target.closest('.column-dropdown-container')) {
        setShowColumnDropdown(false);
      }
      if (!target.closest('.portfolio-dropdown-container')) {
        setShowPortfolioDropdown(false);
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
    setIsSymbolSelected(true);
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

  const formatCurrency = (value: number, noDecimals: boolean = false) => {
    if (value === undefined || value === null) return '---';
    return `${currencySymbols[selectedCurrency] || '$'}${value.toLocaleString(undefined, { minimumFractionDigits: noDecimals ? 0 : 2, maximumFractionDigits: noDecimals ? 0 : 2 })}`;
  };

  const getHashColor = (str: string, offset = 0) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return CHART_COLORS[Math.abs(hash + offset) % CHART_COLORS.length];
  };

  const getSectorColor = (sector: string) => {
    if (!sector || sector === 'Unknown') return '#475569';
    const sectorMap: Record<string, number> = {};
    holdings.forEach(h => {
      if ((h.marketValue || 0) <= 0) return;
      const s = h.sector || 'Unknown';
      sectorMap[s] = (sectorMap[s] || 0) + (h.marketValue || 0);
    });
    const index = Object.keys(sectorMap).indexOf(sector);
    if (index === -1) return getHashColor(sector);
    return CHART_COLORS[index % CHART_COLORS.length];
  };

  const getIndustryColor = (industry: string) => {
    if (!industry || industry === 'Unknown') return '#475569';
    const industryMap: Record<string, number> = {};
    holdings.forEach(h => {
      if ((h.marketValue || 0) <= 0) return;
      const i = h.industry || 'Unknown';
      industryMap[i] = (industryMap[i] || 0) + (h.marketValue || 0);
    });
    const index = Object.keys(industryMap).indexOf(industry);
    if (index === -1) return getHashColor(industry, 3);
    return CHART_COLORS[(index + 3) % CHART_COLORS.length];
  };

  const handleEditTransactionSubmit = async (e: React.FormEvent | React.MouseEvent, symbol: string) => {
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
  const allUniqueSymbols = Array.from(new Set(openHoldingsSource.map(h => h.symbol))).sort((a, b) => a.localeCompare(b));

  const filteredHoldings = selectedPortfolioSymbols.length > 0
    ? openHoldingsSource.filter(h => selectedPortfolioSymbols.includes(h.symbol))
    : openHoldingsSource;

  const closedHoldings = selectedPortfolioSymbols.length > 0
    ? closedHoldingsSource.filter(h => selectedPortfolioSymbols.includes(h.symbol))
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

    if (key === 'aiScore') {
      const getScore = (symbol: string) => {
        const aiData = aiResults.find(r => r.symbol === symbol);
        if (!aiData) return 0;
        return (aiData.garpScore + aiData.moatScore + aiData.valueScore) / 3;
      };
      const aValScore = getScore(a.symbol);
      const bValScore = getScore(b.symbol);
      if (aValScore < bValScore) return direction === 'asc' ? -1 : 1;
      if (aValScore > bValScore) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    if (key === 'portfolioPct') {
      const aVal = a.marketValue || 0;
      const bVal = b.marketValue || 0;
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    }

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

  const totalDailyChange = filteredHoldings.reduce((sum, h) => sum + convertValue((h.dailyChange || 0) * h.quantity, h.currency), 0);
  const isDailyProfit = totalDailyChange >= 0;

  const isProfit = totalUnrealizedPL >= 0;

  let latestMarketDateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (holdings.length > 0) {
    const validDates = holdings.map(h => h.marketDate ? new Date(h.marketDate).getTime() : 0).filter(t => t > 0);
    if (validDates.length > 0) {
      const maxTime = Math.max(...validDates);
      latestMarketDateStr = new Date(maxTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  }

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
    ...holdings.filter(h => selectedPortfolioSymbols.includes(h.symbol)).map(h => ({
      symbol: h.symbol,
      price: formatCurrency(convertValue(h.currentPrice, h.currency)),
      change: (h.dailyChangePct || 0).toFixed(2) + '%',
      isCustom: true
    }))
  ];

  const SortableHeader = ({ label, sortKey, alignRight = false, alignCenter = false, className = "", style = {}, draggable, onDragStart, onDragOver, onDrop, onDragEnd }: { label: string, sortKey: string, alignRight?: boolean, alignCenter?: boolean, className?: string, style?: React.CSSProperties, draggable?: boolean, onDragStart?: any, onDragOver?: any, onDrop?: any, onDragEnd?: any }) => {
    return (
      <th
        className={`font-semibold cursor-pointer select-none group hover:text-white transition-colors ${alignRight ? 'text-right' : alignCenter ? 'text-center' : ''} ${className}`}
        style={style}
        onClick={() => requestSort(sortKey)}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
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

  const renderHeader = (colId: string) => {
    if (!visibleColumns[colId]) return null;
    const isDragOver = dragOverCol === colId;
    const isDragged = draggedCol === colId;
    const dragProps = {
      draggable: true,
      onDragStart: (e: any) => handleDragStart(e, colId),
      onDragOver: (e: any) => handleDragOver(e, colId),
      onDrop: (e: any) => handleDrop(e, colId),
      onDragEnd: () => { setDraggedCol(null); setDragOverCol(null); },
      className: `${isDragged ? 'opacity-30' : ''} ${isDragOver ? 'border-l-2 border-fintech-accent bg-fintech-accent/10' : ''}`
    };

    switch (colId) {
      case 'symbol': return <SortableHeader key={colId} label="Symbol" sortKey="symbol" style={getColumnStyle(visibleColumns.symbol, '100px')} {...dragProps} />;
      case 'quantity': return <SortableHeader key={colId} label="Shares" sortKey="quantity" alignCenter style={getColumnStyle(visibleColumns.quantity, '100px')} {...dragProps} />;
      case 'avgBuyPrice': return <SortableHeader key={colId} label="Avg Price" sortKey="avgBuyPrice" alignRight style={getColumnStyle(visibleColumns.avgBuyPrice, '120px')} {...dragProps} />;
      case 'currentPrice': return <SortableHeader key={colId} label="Current Price" sortKey="currentPrice" alignRight style={getColumnStyle(visibleColumns.currentPrice, '120px')} {...dragProps} />;
      case 'portfolioPct': return <SortableHeader key={colId} label="Port. %" sortKey="portfolioPct" alignRight style={getColumnStyle(visibleColumns.portfolioPct, '100px')} {...dragProps} />;
      case 'marketValue': return <SortableHeader key={colId} label="Market Value" sortKey="marketValue" alignRight style={getColumnStyle(visibleColumns.marketValue, '140px')} {...dragProps} />;
      case 'dailyChange': return <SortableHeader key={colId} label="Daily Change" sortKey="dailyChange" alignRight style={getColumnStyle(visibleColumns.dailyChange, '140px')} {...dragProps} />;
      case 'unrealizedPL': return <SortableHeader key={colId} label="Unrealized P/L" sortKey="unrealizedPL" alignRight style={getColumnStyle(visibleColumns.unrealizedPL, '140px')} {...dragProps} />;
      case 'aiScore': return <SortableHeader key={colId} label="AI Score" sortKey="aiScore" alignRight style={getColumnStyle(visibleColumns.aiScore, '110px')} {...dragProps} />;
      case 'yieldPct': return <SortableHeader key={colId} label="Div Yield" sortKey="yieldPct" alignRight style={getColumnStyle(visibleColumns.yieldPct, '100px')} {...dragProps} />;
      case 'sector': return <SortableHeader key={colId} label="Sector" sortKey="sector" style={getColumnStyle(visibleColumns.sector, '150px')} {...dragProps} />;
      case 'industry': return <SortableHeader key={colId} label="Industry" sortKey="industry" style={getColumnStyle(visibleColumns.industry, '150px')} {...dragProps} />;
      default: return null;
    }
  };

  const renderCell = (colId: string, h: any, isRowProfit: boolean, hideValues: boolean) => {
    if (!visibleColumns[colId]) return null;
    switch (colId) {
      case 'symbol': return (
        <td key="symbol" style={getColumnStyle(visibleColumns.symbol, '100px')} className="cursor-pointer group/symbol" onClick={(e) => { e.stopPropagation(); setExplanationSymbol(h.symbol); }}>
          <div className="font-bold flex items-center gap-1.5 group-hover/symbol:text-fintech-accent transition-colors" style={{ color: isRowProfit ? 'rgba(138, 255, 213, 0.8)' : 'rgba(243, 129, 129, 0.8)' }}>
            <span>{h.symbol}</span>
            <Info size={12} className="opacity-0 group-hover/symbol:opacity-100 text-fintech-accent transition-all transform translate-x-1 group-hover/symbol:translate-x-0" />
          </div>
        </td>
      );
      case 'quantity': return <td key="quantity" style={getColumnStyle(visibleColumns.quantity, '100px')} className="text-center font-medium">{hideValues ? '****' : h.quantity}</td>;
      case 'avgBuyPrice': return <td key="avgBuyPrice" style={getColumnStyle(visibleColumns.avgBuyPrice, '120px')} className="text-right text-fintech-muted">{hideValues ? '****' : formatCurrency(convertValue(h.avgBuyPrice, h.currency))}</td>;
      case 'currentPrice': return <td key="currentPrice" style={getColumnStyle(visibleColumns.currentPrice, '120px')} className="text-right font-medium">{formatCurrency(convertValue(h.currentPrice, h.currency))}</td>;
      case 'portfolioPct': return <td key="portfolioPct" style={getColumnStyle(visibleColumns.portfolioPct, '100px')} className="text-right font-medium text-fintech-accent tracking-wide">{totalMarketValue > 0 && h.marketValue ? ((h.marketValue / totalMarketValue) * 100).toFixed(2) : '0.00'}%</td>;
      case 'marketValue': return <td key="marketValue" style={getColumnStyle(visibleColumns.marketValue, '140px')} className="text-right font-semibold text-white">{hideValues ? '****' : formatCurrency(convertValue(h.marketValue || 0, h.currency))}</td>;
      case 'dailyChange': return (
        <td key="dailyChange" style={getColumnStyle(visibleColumns.dailyChange, '140px')} className={`text-right font-bold ${(h.dailyChange || 0) >= 0 ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
          <div className="flex flex-col items-end">
            <span>{hideValues ? '****' : `${(h.dailyChange || 0) >= 0 ? '+' : ''}${formatCurrency(convertValue((h.dailyChange || 0) * h.quantity, h.currency))}`}</span>
            <span className="text-sm opacity-80">{(h.dailyChangePct || 0) >= 0 ? '+' : ''}{(h.dailyChangePct || 0).toFixed(2)}%</span>
          </div>
        </td>
      );
      case 'unrealizedPL': return (
        <td key="unrealizedPL" style={getColumnStyle(visibleColumns.unrealizedPL, '140px')} className={`text-right font-bold ${isRowProfit ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
          <div className="flex flex-col items-end">
            <span>{hideValues ? '****' : `${isRowProfit ? '+' : ''}${formatCurrency(convertValue(h.unrealizedPL || 0, h.currency))}`}</span>
            <span className="text-sm opacity-80">{isRowProfit ? '+' : ''}{(h.unrealizedPLPercent || 0).toFixed(2)}%</span>
          </div>
        </td>
      );
      case 'aiScore': return (
        <td key="aiScore" style={getColumnStyle(visibleColumns.aiScore, '110px')} className="text-right">
          {(() => {
            const aiData = aiResults.find(r => r.symbol === h.symbol);
            if (!aiData) return <span className="text-fintech-muted text-xs opacity-50">-</span>;
            const isTrinity = aiData.garpScore >= 75 && aiData.moatScore >= 75 && aiData.valueScore >= 75;
            const isConfluence = !isTrinity && [aiData.garpScore, aiData.moatScore, aiData.valueScore].filter((s: number) => s >= 75).length >= 2;
            return (
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-indigo-300 font-medium" title={`GARP: ${aiData.garpScore}`}>G:{aiData.garpScore}</span>
                  <span className="text-purple-300 font-medium" title={`Moat: ${aiData.moatScore}`}>M:{aiData.moatScore}</span>
                  <span className="text-amber-300 font-medium" title={`Value: ${aiData.valueScore}`}>V:{aiData.valueScore}</span>
                </div>
                {(isTrinity || isConfluence) && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 mt-0.5 rounded shadow-sm ${isTrinity ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'}`}>
                    {isTrinity ? 'TRINITY' : 'CONFLUENCE'}
                  </span>
                )}
              </div>
            );
          })()}
        </td>
      );
      case 'yieldPct': return (
        <td key="yieldPct" style={getColumnStyle(visibleColumns.yieldPct, '100px')} className="text-right">
          <div className="text-fintech-muted">{(h.yieldPct || 0).toFixed(2)}%</div>
          {(h.exDividendDate || h.dividendDate) && (
            <div className="text-[10px] text-fintech-muted flex flex-col mt-1 items-end opacity-80">
              {h.exDividendDate && <span>Ex: {new Date(h.exDividendDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>}
              {h.dividendDate && <span>Pay: {new Date(h.dividendDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>}
            </div>
          )}
        </td>
      );
      case 'sector': return <td key="sector" style={getColumnStyle(visibleColumns.sector, '150px')} className="text-sm text-fintech-muted truncate max-w-[130px]" title={h.sector}>{h.sector || 'Unknown'}</td>;
      case 'industry': return <td key="industry" style={getColumnStyle(visibleColumns.industry, '150px')} className="text-sm text-fintech-muted truncate max-w-[130px]" title={h.industry}>{h.industry || 'Unknown'}</td>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-fintech-bg text-fintech-text p-4 md:p-10 pb-24 overflow-x-hidden max-w-full selection:bg-fintech-accent selection:text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fintech-accent to-emerald-400">
            Portfolio Tracker
            {selectedPortfolioSymbols.length > 0 && <span className="ml-3 text-sm font-bold px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/30 uppercase tracking-widest align-middle">Custom View</span>}
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
          <div className="relative portfolio-dropdown-container order-3 sm:order-none">
            <button
              onClick={() => setShowPortfolioDropdown(!showPortfolioDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 border ${selectedPortfolioSymbols.length > 0
                ? 'bg-fintech-accent border-fintech-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-fintech-card border-fintech-border text-fintech-text hover:bg-fintech-border'
                }`}
            >
              {selectedPortfolioSymbols.length > 0 ? `Filtered (${selectedPortfolioSymbols.length})` : 'All Assets'}
              <ChevronDown size={14} />
            </button>
            {showPortfolioDropdown && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 bg-slate-900 border border-fintech-border rounded-xl shadow-2xl z-50 p-2 max-h-80 overflow-y-auto custom-scrollbar">
                <div className="p-2 border-b border-fintech-border mb-2 flex flex-wrap justify-between items-center gap-2">
                  <span className="text-sm font-semibold text-white">Filter Portfolio</span>
                  <div className="flex gap-2">
                    {selectedPortfolioSymbols.length !== allUniqueSymbols.length && allUniqueSymbols.length > 0 && (
                      <button 
                        onClick={() => setSelectedPortfolioSymbols(allUniqueSymbols)}
                        className="text-xs text-fintech-accent hover:text-white transition-colors"
                      >
                        Select All
                      </button>
                    )}
                    {selectedPortfolioSymbols.length > 0 && (
                      <button 
                        onClick={() => setSelectedPortfolioSymbols([])}
                        className="text-xs text-fintech-accent hover:text-white transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                {allUniqueSymbols.map(sym => (
                  <label key={sym} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={selectedPortfolioSymbols.includes(sym)}
                      onChange={() => {
                        setSelectedPortfolioSymbols(prev => 
                          prev.includes(sym) 
                            ? prev.filter(s => s !== sym) 
                            : [...prev, sym]
                        );
                      }}
                      className="rounded bg-slate-800 border-fintech-border text-fintech-accent focus:ring-fintech-accent"
                    />
                    <div className="font-medium text-white">{sym}</div>
                  </label>
                ))}
                {allUniqueSymbols.length === 0 && (
                   <div className="text-sm text-fintech-muted p-2 text-center">No assets found.</div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 order-4 sm:order-none">
            <button
              onClick={runAiAnalysis}
              disabled={aiLoading || (holdings.length === 0 && watchlist.length === 0)}
              className="p-2 rounded-full bg-fintech-card border border-indigo-500/30 hover:border-indigo-500 transition-colors flex items-center justify-center text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Run AI Analysis"
            >
              {aiLoading ? <RefreshCw size={20} className="animate-spin text-indigo-400" /> : <Sparkles size={20} />}
            </button>
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
              setIsSymbolSelected(false);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-fintech-muted/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10">Total Capital Invested</p>
          <h2 className="text-3xl font-bold text-white relative z-10">
            {hideValues ? '****' : formatCurrency(totalCostBasis, true)}
          </h2>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-fintech-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10">Total Value</p>
          <h2 className="text-3xl font-bold text-white relative z-10">
            {hideValues ? '****' : formatCurrency(totalMarketValue, true)}
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

        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br from-${isDailyProfit ? 'fintech-profit' : 'fintech-loss'}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10 flex justify-between items-center">
            <span>Total Daily Change</span>
            <span className="text-xs opacity-60 font-normal">{latestMarketDateStr}</span>
          </p>
          <div className="flex items-end gap-3 relative z-10">
            <h2 className={`text-3xl font-bold ${isDailyProfit ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
              {hideValues ? '****' : `${isDailyProfit ? '+' : ''}${formatCurrency(totalDailyChange)}`}
            </h2>
            <div className={`flex items-center mb-1 text-sm font-semibold px-2 py-0.5 rounded-md ${isDailyProfit ? 'bg-fintech-profit/20 text-fintech-profit' : 'bg-fintech-loss/20 text-fintech-loss'}`}>
              {isDailyProfit ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {totalMarketValue > 0 ? ((totalDailyChange / totalMarketValue) * 100).toFixed(2) : 0}%
            </div>
          </div>
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
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-slate-900 border border-fintech-border rounded-xl shadow-2xl z-50 p-2 max-h-80 overflow-y-auto">
                   {Object.keys(visibleColumns).map(col => (
                     <label key={col} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-300">
                       <input 
                         type="checkbox" 
                         checked={visibleColumns[col]} 
                         onChange={() => setVisibleColumns(prev => ({...prev, [col]: !prev[col]}))}
                         className="rounded bg-slate-800 border-fintech-border text-fintech-accent focus:ring-fintech-accent"
                       />
                       {col === 'index' ? '#' : col === 'portfolioPct' ? 'Portfolio %' : col === 'unrealizedPL' ? 'Unrealized P/L' : col === 'yieldPct' ? 'Div Yield' : col === 'avgBuyPrice' ? 'Avg Price' : col === 'dailyChange' ? 'Daily Change' : col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                     </label>
                   ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-fintech-card border border-fintech-border rounded-2xl shadow-xl overflow-hidden mb-12">
            <div className="overflow-x-auto no-scrollbar">
              <table 
                className="text-left border-collapse transition-all duration-300"
                style={{
                  width: '100%',
                  minWidth: `${Math.max(600, Math.round((visibleCount / totalPossibleColumns) * 1000))}px`
                }}
              >
                <thead>
                  <tr className="bg-fintech-bg/50 border-b border-fintech-border text-fintech-muted text-sm uppercase tracking-wider">
                    <th style={getColumnStyle(visibleColumns.index, '48px', '48px')} className="font-semibold text-center hidden md:table-cell">#</th>
                    {columnOrder.map(col => renderHeader(col))}
                    <th style={getColumnStyle(visibleColumns.actions, '80px')} className="font-semibold text-center sticky right-0 bg-fintech-card border-l border-fintech-border z-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fintech-border">
                    {sortedHoldings.length === 0 ? (
                      <tr>
                        <td colSpan={100} className="p-8 text-center text-fintech-muted">
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
                            className={`hover:bg-fintech-bg/30 transition-colors group/row ${isExpanded ? 'bg-fintech-bg/10' : ''}`}
                          >
                            <td style={getColumnStyle(visibleColumns.index, '48px', '48px')} className="text-center text-fintech-muted font-medium hidden md:table-cell">{i + 1}</td>
                            {columnOrder.map(col => renderCell(col, h, isRowProfit, hideValues))}
                            <td 
                              style={getColumnStyle(visibleColumns.actions, '80px')} 
                              className="text-center text-fintech-muted sticky right-0 bg-fintech-card border-l border-fintech-border z-10 cursor-pointer hover:bg-fintech-border/30 transition-colors"
                              onClick={() => toggleRow(h.symbol)}
                            >
                              <button className="p-2 rounded-full pointer-events-none">
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Transaction Ledger Row */}
                          {isExpanded && (
                            <tr className="bg-fintech-bg/50 border-b border-fintech-border">
                              <td colSpan={100} className="p-6">
                                <div className="rounded-xl border border-fintech-border bg-fintech-card overflow-hidden">
                                  {/* Sub-table Header */}
                                  <div className="bg-slate-800/50 px-4 py-3 border-b border-fintech-border flex justify-between items-center">
                                    <h4 className="text-sm font-semibold text-fintech-text tracking-wide uppercase">Transaction Ledger: {h.symbol}</h4>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (txnFormActiveSymbol === h.symbol) {
                                          setTxnFormActiveSymbol(null);
                                        } else {
                                          setTxnFormActiveSymbol(h.symbol);
                                          setTxnForm(prev => ({
                                            ...prev,
                                            price: h.currentPrice ? h.currentPrice.toString() : ''
                                          }));
                                          try {
                                            const res = await fetch(`/api/price?symbol=${h.symbol}`);
                                            const data = await res.json();
                                            if (data.price) {
                                              setTxnForm(prev => ({ ...prev, price: data.price.toString() }));
                                            }
                                          } catch (err) {
                                            console.error('Failed to fetch real-time price', err);
                                          }
                                        }
                                      }}
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

          {/* Watchlist Section */}
          <div className="mt-12 mb-12">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 border-b border-fintech-border pb-3 gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h3 className="text-xl font-bold text-white uppercase tracking-widest opacity-80">
                  Watchlist
                </h3>
                {aiResults.length > 0 && (
                  <div className="flex bg-slate-900 border border-fintech-border p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setAiModelView('trinity')}
                      className={`px-3 py-1.5 rounded-md transition-colors ${aiModelView === 'trinity' ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300' : 'text-fintech-muted hover:text-white'}`}
                    >
                      ✨ Trinity
                    </button>
                    <button
                      onClick={() => setAiModelView('confluence')}
                      className={`px-3 py-1.5 rounded-md transition-colors ${aiModelView === 'confluence' ? 'bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-300' : 'text-fintech-muted hover:text-white'}`}
                    >
                      🛡️ Confluence
                    </button>
                    <button
                      onClick={() => setAiModelView('garp')}
                      className={`px-3 py-1.5 rounded-md transition-colors ${aiModelView === 'garp' ? 'bg-indigo-500/20 text-indigo-300' : 'text-fintech-muted hover:text-white'}`}
                    >
                      📈 GARP
                    </button>
                    <button
                      onClick={() => setAiModelView('moat')}
                      className={`px-3 py-1.5 rounded-md transition-colors ${aiModelView === 'moat' ? 'bg-purple-500/20 text-purple-300' : 'text-fintech-muted hover:text-white'}`}
                    >
                      🏰 Fortress Moat
                    </button>
                    <button
                      onClick={() => setAiModelView('value')}
                      className={`px-3 py-1.5 rounded-md transition-colors ${aiModelView === 'value' ? 'bg-amber-500/20 text-amber-300' : 'text-fintech-muted hover:text-white'}`}
                    >
                      💎 Deep Value
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 self-end md:self-auto">
                <button 
                  onClick={runAiAnalysis}
                  disabled={aiLoading || watchlist.length === 0}
                  className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg hover:from-indigo-500/30 hover:to-purple-500/30 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                  <span className="hidden sm:inline">{aiLoading ? 'Analyzing...' : 'AI 5-Year Picks'}</span>
                  <span className="sm:hidden">{aiLoading ? '...' : 'AI'}</span>
                </button>
                <button 
                  onClick={() => {
                    setWatchlistInput('');
                    setSearchResults([]);
                    setShowWatchlistModal(true);
                  }}
                  className="text-sm px-4 py-2 bg-fintech-card border border-fintech-border text-white rounded-lg hover:border-fintech-accent hover:text-fintech-accent transition-colors font-medium flex items-center gap-2"
                >
                  <Plus size={16} /> <span className="hidden sm:inline">Add Symbol</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...watchlist].sort((a, b) => {
                 if (aiResults.length > 0) {
                   const aiA = aiResults.find(r => r.symbol === a.symbol);
                   const aiB = aiResults.find(r => r.symbol === b.symbol);
                   
                   if (!aiA) return 1;
                   if (!aiB) return -1;

                   if (aiModelView === 'trinity') {
                     const isTrinityA = aiA.garpScore >= 75 && aiA.moatScore >= 75 && aiA.valueScore >= 75;
                     const isTrinityB = aiB.garpScore >= 75 && aiB.moatScore >= 75 && aiB.valueScore >= 75;
                     
                     if (isTrinityA && !isTrinityB) return -1;
                     if (isTrinityB && !isTrinityA) return 1;
                     
                     const avgA = (aiA.garpScore + aiA.moatScore + aiA.valueScore) / 3;
                     const avgB = (aiB.garpScore + aiB.moatScore + aiB.valueScore) / 3;
                     
                     if (avgB !== avgA) return avgB - avgA;
                     
                     if (a.isStarred && !b.isStarred) return -1;
                     if (b.isStarred && !a.isStarred) return 1;
                     
                     return (aiB.upsidePct || 0) - (aiA.upsidePct || 0);
                   } else if (aiModelView === 'confluence') {
                     const isTrinityA = aiA.garpScore >= 75 && aiA.moatScore >= 75 && aiA.valueScore >= 75;
                     const isTrinityB = aiB.garpScore >= 75 && aiB.moatScore >= 75 && aiB.valueScore >= 75;
                     
                     if (isTrinityA && !isTrinityB) return -1;
                     if (isTrinityB && !isTrinityA) return 1;

                     const isConfluenceA = [aiA.garpScore, aiA.moatScore, aiA.valueScore].filter((s: number) => s >= 75).length >= 2;
                     const isConfluenceB = [aiB.garpScore, aiB.moatScore, aiB.valueScore].filter((s: number) => s >= 75).length >= 2;
                     
                     if (isConfluenceA && !isConfluenceB) return -1;
                     if (isConfluenceB && !isConfluenceA) return 1;
                     
                     const avgA = (aiA.garpScore + aiA.moatScore + aiA.valueScore) / 3;
                     const avgB = (aiB.garpScore + aiB.moatScore + aiB.valueScore) / 3;
                     
                     if (avgB !== avgA) return avgB - avgA;
                     
                     if (a.isStarred && !b.isStarred) return -1;
                     if (b.isStarred && !a.isStarred) return 1;
                     
                     return (aiB.upsidePct || 0) - (aiA.upsidePct || 0);
                   } else if (aiModelView === 'garp') {
                     const sortedGarp = [...aiResults].sort((x, y) => {
                       if (y.garpScore !== x.garpScore) return y.garpScore - x.garpScore;
                       return (y.upsidePct || 0) - (x.upsidePct || 0);
                     });
                     
                     const isTopGarpA = sortedGarp[0]?.symbol === a.symbol;
                     const isTopGarpB = sortedGarp[0]?.symbol === b.symbol;
                     
                     if (isTopGarpA && !isTopGarpB) return -1;
                     if (isTopGarpB && !isTopGarpA) return 1;
                     
                     if (aiB.garpScore !== aiA.garpScore) return aiB.garpScore - aiA.garpScore;
                     
                     if (a.isStarred && !b.isStarred) return -1;
                     if (b.isStarred && !a.isStarred) return 1;
                     
                     return (aiB.upsidePct || 0) - (aiA.upsidePct || 0);
                   } else if (aiModelView === 'moat') {
                     const sortedMoat = [...aiResults].sort((x, y) => {
                       if (y.moatScore !== x.moatScore) return y.moatScore - x.moatScore;
                       return (y.upsidePct || 0) - (x.upsidePct || 0);
                     });
                     
                     const isTopMoatA = sortedMoat[0]?.symbol === a.symbol;
                     const isTopMoatB = sortedMoat[0]?.symbol === b.symbol;
                     
                     if (isTopMoatA && !isTopMoatB) return -1;
                     if (isTopMoatB && !isTopMoatA) return 1;
                     
                     if (aiB.moatScore !== aiA.moatScore) return aiB.moatScore - aiA.moatScore;
                     
                     if (a.isStarred && !b.isStarred) return -1;
                     if (b.isStarred && !a.isStarred) return 1;
                     
                     return (aiB.upsidePct || 0) - (aiA.upsidePct || 0);
                   } else if (aiModelView === 'value') {
                     const sortedValue = [...aiResults].sort((x, y) => {
                       if (y.valueScore !== x.valueScore) return y.valueScore - x.valueScore;
                       return (y.upsidePct || 0) - (x.upsidePct || 0);
                     });
                     
                     const isTopValueA = sortedValue[0]?.symbol === a.symbol;
                     const isTopValueB = sortedValue[0]?.symbol === b.symbol;
                     
                     if (isTopValueA && !isTopValueB) return -1;
                     if (isTopValueB && !isTopValueA) return 1;
                     
                     if (aiB.valueScore !== aiA.valueScore) return aiB.valueScore - aiA.valueScore;
                     
                     if (a.isStarred && !b.isStarred) return -1;
                     if (b.isStarred && !a.isStarred) return 1;
                     
                     return (aiB.upsidePct || 0) - (aiA.upsidePct || 0);
                   }
                 }
                 return (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0);
              }).map((w, i) => {
                  const aiData = aiResults.find(r => r.symbol === w.symbol);
                  
                  let cardBorderClass = 'border-fintech-border';
                  let showTopPickBadge = false;
                  let showConfluenceBadge = false;
                  let showTrinityBadge = false;
                  
                  if (aiResults.length > 0 && aiData) {
                    const isTrinity = aiData.garpScore >= 75 && aiData.moatScore >= 75 && aiData.valueScore >= 75;
                    const isConfluence = !isTrinity && [aiData.garpScore, aiData.moatScore, aiData.valueScore].filter((s: number) => s >= 75).length >= 2;
                    
                    if (aiModelView === 'trinity') {
                      if (isTrinity) {
                        cardBorderClass = 'border-amber-400/70 shadow-[0_0_25px_rgba(251,191,36,0.3)]';
                        showTrinityBadge = true;
                      } else {
                        const isTopAvg = aiResults[0]?.symbol === w.symbol;
                        if (isTopAvg) {
                          cardBorderClass = 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]';
                          showTopPickBadge = true;
                        } else if (w.isStarred) {
                          cardBorderClass = 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
                        }
                      }
                    } else if (aiModelView === 'confluence') {
                      if (isTrinity) {
                        cardBorderClass = 'border-amber-400/70 shadow-[0_0_25px_rgba(251,191,36,0.3)]';
                        showTrinityBadge = true;
                      } else if (isConfluence) {
                        cardBorderClass = 'border-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.25)]';
                        showConfluenceBadge = true;
                      } else {
                        const isTopAvg = aiResults[0]?.symbol === w.symbol;
                        if (isTopAvg) {
                          cardBorderClass = 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]';
                          showTopPickBadge = true;
                        } else if (w.isStarred) {
                          cardBorderClass = 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
                        }
                      }
                    } else if (aiModelView === 'garp') {
                      const sortedGarp = [...aiResults].sort((x, y) => {
                        if (y.garpScore !== x.garpScore) return y.garpScore - x.garpScore;
                        return (y.upsidePct || 0) - (x.upsidePct || 0);
                      });
                      if (sortedGarp[0]?.symbol === w.symbol) {
                        cardBorderClass = 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]';
                        showTopPickBadge = true;
                      } else if (w.isStarred) {
                        cardBorderClass = 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
                      }
                    } else if (aiModelView === 'moat') {
                      const sortedMoat = [...aiResults].sort((x, y) => {
                        if (y.moatScore !== x.moatScore) return y.moatScore - x.moatScore;
                        return (y.upsidePct || 0) - (x.upsidePct || 0);
                      });
                      if (sortedMoat[0]?.symbol === w.symbol) {
                        cardBorderClass = 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]';
                        showTopPickBadge = true;
                      } else if (w.isStarred) {
                        cardBorderClass = 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
                      }
                    } else if (aiModelView === 'value') {
                      const sortedValue = [...aiResults].sort((x, y) => {
                        if (y.valueScore !== x.valueScore) return y.valueScore - x.valueScore;
                        return (y.upsidePct || 0) - (x.upsidePct || 0);
                      });
                      if (sortedValue[0]?.symbol === w.symbol) {
                        cardBorderClass = 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]';
                        showTopPickBadge = true;
                      } else if (w.isStarred) {
                        cardBorderClass = 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
                      }
                    }
                  } else if (w.isStarred) {
                    cardBorderClass = 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
                  }

                  return (
                  <div key={i} className={`bg-fintech-card border ${cardBorderClass} rounded-xl p-5 shadow-lg hover:border-fintech-accent/50 transition-colors relative group`}>
                    {showTrinityBadge && (
                       <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20 z-10 animate-pulse">
                         <Sparkles size={10} /> TRINITY
                       </div>
                    )}
                    {showConfluenceBadge && (
                       <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20 z-10 animate-pulse">
                         <Sparkles size={10} /> DUAL CONFLUENCE
                       </div>
                    )}
                    {showTopPickBadge && !showConfluenceBadge && !showTrinityBadge && (
                       <div className="absolute -top-3 -right-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20 z-10">
                         <Sparkles size={10} /> AI TOP PICK
                       </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <div 
                        className="cursor-pointer group/w-symbol"
                        onClick={() => setExplanationSymbol(w.symbol)}
                     >
                       <div className="font-bold text-lg text-white tracking-wide flex items-center gap-1.5 group-hover/w-symbol:text-fintech-accent transition-colors">
                         <span>{w.symbol}</span>
                         <Info size={12} className="opacity-0 group-hover/w-symbol:opacity-100 text-fintech-accent transition-all transform translate-x-1 group-hover/w-symbol:translate-x-0" />
                       </div>
                       <div className="flex items-center gap-2 mt-0.5">
                         <div className="text-xs text-fintech-muted truncate max-w-[140px] opacity-80 group-hover/w-symbol:text-slate-300 transition-colors">{w.name}</div>
                         {holdings.some(h => h.symbol === w.symbol) && (
                           <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                             <Check size={8} /> OWNED
                           </span>
                         )}
                       </div>
                       <div className="flex flex-wrap gap-1 mt-2">
                         {w.sector && w.sector !== 'Unknown' && (
                           <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white shadow-sm" style={{ backgroundColor: getSectorColor(w.sector) }}>
                             {w.sector}
                           </span>
                         )}
                         {w.industry && w.industry !== 'Unknown' && (
                           <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white shadow-sm" style={{ backgroundColor: getIndustryColor(w.industry) }}>
                             {w.industry}
                           </span>
                         )}
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
                       <button 
                         onClick={() => {
                           setFormData({ symbol: w.symbol, quantity: '1', avgBuyPrice: (w.price || 0).toString(), date: new Date().toISOString().split('T')[0] });
                           setIsSymbolSelected(true);
                           setSearchResults([]);
                           setShowModal(true);
                         }}
                         className="text-fintech-muted hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-emerald-500/10"
                         title="Add to Portfolio"
                       >
                         <Plus size={16} />
                       </button>
                       <button 
                         onClick={() => handleToggleStar(w)}
                         className={`p-1.5 rounded-md transition-colors ${w.isStarred ? 'text-amber-400 hover:text-amber-300' : 'text-fintech-muted hover:text-amber-400/70 opacity-0 group-hover:opacity-100'}`}
                         title={w.isStarred ? "Unstar" : "Star"}
                       >
                         <Star size={16} fill={w.isStarred ? 'currentColor' : 'none'} />
                       </button>
                       <button 
                         onClick={() => handleRemoveFromWatchlist(w.id || w.symbol)}
                         className="text-fintech-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-500/10"
                       >
                         <X size={16} />
                       </button>
                     </div>
                   </div>
                   <div className="flex justify-between items-end mt-5">
                     <div>
                       <div className="text-xl font-semibold text-white tracking-tight">
                         {formatCurrency(convertValue(w.price, w.currency))}
                       </div>
                       {w.addedPrice && (
                         <div className={`text-xs mt-1 flex items-center gap-1 font-medium ${(w.sinceAddedChangePct || 0) >= 0 ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
                           <span className="text-fintech-muted opacity-70">Total Return Since Watched:</span>
                           {(w.sinceAddedChangePct || 0) >= 0 ? '+' : ''}{(w.sinceAddedChangePct || 0).toFixed(2)}%
                         </div>
                       )}
                     </div>
                     <div className="flex flex-col items-end gap-1">
                       <div className="text-[10px] text-fintech-muted uppercase font-bold tracking-wider">Today</div>
                       <div className={`text-sm font-bold flex items-center gap-1 px-2 py-1 rounded-md ${(w.change || 0) >= 0 ? 'bg-fintech-profit/10 text-fintech-profit' : 'bg-fintech-loss/10 text-fintech-loss'}`}>
                         {(w.change || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                         {Math.abs(w.change || 0).toFixed(2)}%
                       </div>
                     </div>
                   </div>
                   {aiData && (
                      <div className="mt-4 pt-4 border-t border-fintech-border/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                            {aiModelView === 'confluence' || aiModelView === 'trinity' ? (
                              <span className="flex items-center gap-1"><Sparkles size={10} /> AI Score:</span>
                            ) : aiModelView === 'garp' ? (
                              <span className="flex items-center gap-1"><TrendingUp size={10} /> GARP Score:</span>
                            ) : aiModelView === 'moat' ? (
                              <span className="flex items-center gap-1"><Building2 size={10} /> Moat Score:</span>
                            ) : (
                              <span className="flex items-center gap-1">💎 Value Score:</span>
                            )}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            ((aiModelView === 'confluence' || aiModelView === 'trinity') ? (aiData.garpScore + aiData.moatScore + aiData.valueScore)/3 : aiModelView === 'garp' ? aiData.garpScore : aiModelView === 'moat' ? aiData.moatScore : aiData.valueScore) > 70 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : ((aiModelView === 'confluence' || aiModelView === 'trinity') ? (aiData.garpScore + aiData.moatScore + aiData.valueScore)/3 : aiModelView === 'garp' ? aiData.garpScore : aiModelView === 'moat' ? aiData.moatScore : aiData.valueScore) > 50 
                                ? 'bg-amber-500/20 text-amber-400' 
                                : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {(aiModelView === 'confluence' || aiModelView === 'trinity') 
                              ? `${Math.round((aiData.garpScore + aiData.moatScore + aiData.valueScore) / 3)}/100` 
                              : aiModelView === 'garp' 
                                ? `${aiData.garpScore}/100` 
                                : aiModelView === 'moat'
                                  ? `${aiData.moatScore}/100`
                                  : `${aiData.valueScore}/100`}
                          </span>
                        </div>

                        {/* Combined dashboard metrics inside card if Confluence or Trinity is active */}
                        {(aiModelView === 'confluence' || aiModelView === 'trinity') && (
                          <div className="flex gap-2 mb-3 bg-slate-900/60 p-1.5 rounded-lg border border-fintech-border/30 text-[10px] text-center font-medium">
                            <div className="flex-1">
                              <div className="text-indigo-400 font-semibold mb-0.5">GARP</div>
                              <div className="text-white text-[11px]">{aiData.garpScore}</div>
                            </div>
                            <div className="w-px bg-fintech-border/30 self-stretch" />
                            <div className="flex-1">
                              <div className="text-purple-400 font-semibold mb-0.5">Moat</div>
                              <div className="text-white text-[11px]">{aiData.moatScore}</div>
                            </div>
                            <div className="w-px bg-fintech-border/30 self-stretch" />
                            <div className="flex-1">
                              <div className="text-amber-400 font-semibold mb-0.5">Value</div>
                              <div className="text-white text-[11px]">{aiData.valueScore}</div>
                            </div>
                          </div>
                        )}

                        <ul className="text-[10px] text-fintech-muted space-y-1">
                          {(aiModelView === 'moat' ? aiData.moatReasons : aiModelView === 'garp' ? aiData.garpReasons : aiModelView === 'value' ? aiData.valueReasons : [...(aiData.garpReasons||[]), ...(aiData.moatReasons||[]), ...(aiData.valueReasons||[])]).map((r: string, idx: number) => (
                            <li key={idx} className="flex gap-1 items-start">
                              <div className="text-indigo-400 mt-0.5">•</div>
                              <span className="leading-tight">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                 </div>
              )})}
              {watchlist.length === 0 && (
                <div className="col-span-full py-10 text-center text-fintech-muted bg-fintech-card/50 rounded-xl border border-dashed border-fintech-border">
                  Your watchlist is empty. Add symbols to keep an eye on them without adding them to your portfolio.
                </div>
              )}
            </div>
          </div>

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
                              className={`hover:bg-fintech-bg/20 transition-colors group/row ${isExpanded ? 'bg-fintech-bg/10' : ''}`}
                            >
                              <td className="p-5 text-center text-fintech-muted opacity-50 text-sm w-12">{i + 1}</td>
                              <td 
                                className="p-5 cursor-pointer group/symbol"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExplanationSymbol(h.symbol);
                                }}
                              >
                                <div className="font-bold text-white opacity-80 flex items-center gap-1.5 group-hover/symbol:text-fintech-accent transition-colors">
                                  <span>{h.symbol}</span>
                                  <Info size={12} className="opacity-0 group-hover/symbol:opacity-100 text-fintech-accent transition-all transform translate-x-1 group-hover/symbol:translate-x-0" />
                                </div>
                                <div className="text-xs text-fintech-muted opacity-60 mt-0.5 group-hover/symbol:text-slate-300 transition-colors">{h.name}</div>
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
                              <td 
                                className="p-5 text-center text-fintech-muted cursor-pointer hover:bg-slate-700/30 transition-colors"
                                onClick={() => toggleRow(h.symbol)}
                              >
                                <button className="p-2 rounded-full pointer-events-none">
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
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (txnFormActiveSymbol === h.symbol) {
                                            setTxnFormActiveSymbol(null);
                                          } else {
                                            setTxnFormActiveSymbol(h.symbol);
                                            setTxnForm(prev => ({
                                              ...prev,
                                              price: h.currentPrice ? h.currentPrice.toString() : ''
                                            }));
                                            try {
                                              const res = await fetch(`/api/price?symbol=${h.symbol}`);
                                              const data = await res.json();
                                              if (data.price) {
                                                setTxnForm(prev => ({ ...prev, price: data.price.toString() }));
                                              }
                                            } catch (err) {
                                              console.error('Failed to fetch real-time price', err);
                                            }
                                          }
                                        }}
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
                                                <form className="flex gap-4 items-end max-w-3xl" onSubmit={(e) => handleAddTransaction(e, h.symbol)}>
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
                                                      <button onClick={(e) => handleEditTransactionSubmit(e, h.symbol)} className="text-fintech-accent hover:text-blue-400 font-bold px-1">✓</button>
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
                      setIsSymbolSelected(false);
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
                  disabled={submitLoading || !isSymbolSelected}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-fintech-accent hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {submitLoading ? <RefreshCw size={20} className="animate-spin" /> : 'ADD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Watchlist Modal */}
      {showWatchlistModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fintech-card border border-fintech-border w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add to Watchlist</h2>
              <div className="flex bg-fintech-bg border border-fintech-border rounded-lg p-1">
                <button 
                  onClick={() => setScreenerTabActive(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!screenerTabActive ? 'bg-fintech-card text-white shadow-sm' : 'text-fintech-muted hover:text-white'}`}
                >
                  Search
                </button>
                <button 
                  onClick={() => setScreenerTabActive(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${screenerTabActive ? 'bg-fintech-card text-white shadow-sm' : 'text-fintech-muted hover:text-white'}`}
                >
                  <Sparkles size={12} /> Screener
                </button>
              </div>
            </div>

            {!screenerTabActive ? (
              <form onSubmit={handleAddToWatchlist} className="space-y-4">
              <div className="relative symbol-search-container">
                <label className="block text-sm font-medium text-fintech-muted mb-1">Symbol (e.g. AAPL)</label>
                <div className="relative">
                  <input
                    type="text" required
                    value={watchlistInput}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setWatchlistInput(val);
                      handleSymbolSearch(val);
                    }}
                    onFocus={() => watchlistInput && setShowDropdown(true)}
                    className="w-full bg-fintech-bg border border-fintech-border rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent transition-all uppercase"
                    placeholder="AAPL"
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
                          onClick={() => {
                            setWatchlistInput(s.symbol);
                            setShowDropdown(false);
                          }}
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
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowWatchlistModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-fintech-text bg-fintech-bg border border-fintech-border hover:bg-fintech-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !watchlistInput}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-fintech-accent hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {submitLoading ? <RefreshCw size={20} className="animate-spin" /> : 'Add Symbol'}
                </button>
              </div>
            </form>
            ) : (
              <div className="space-y-4">
                <div className="flex bg-slate-900 border border-fintech-border p-1 rounded-xl mb-4 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveScreenerPool('trinity')}
                    className={`flex-1 py-2 px-1 sm:px-3 rounded-lg transition-all text-center ${activeScreenerPool === 'trinity' ? 'bg-fintech-card text-white shadow-sm border border-fintech-border/50' : 'text-fintech-muted hover:text-white'}`}
                  >
                    🎯 AI Trinity
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveScreenerPool('trending'); if (trendingResults.length === 0) runTrendingScreener(); }}
                    className={`flex-1 py-2 px-1 sm:px-3 rounded-lg transition-all text-center ${activeScreenerPool === 'trending' ? 'bg-fintech-card text-white shadow-sm border border-fintech-border/50' : 'text-fintech-muted hover:text-white'}`}
                  >
                    🔥 Trending
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveScreenerPool('smallcap'); if (smallcapResults.length === 0) runSmallcapScreener(); }}
                    className={`flex-1 py-2 px-1 sm:px-3 rounded-lg transition-all text-center ${activeScreenerPool === 'smallcap' ? 'bg-fintech-card text-white shadow-sm border border-fintech-border/50' : 'text-fintech-muted hover:text-white'}`}
                  >
                    🚀 Small-Cap
                  </button>
                </div>

                <div className="text-sm text-fintech-muted mb-4">
                  {activeScreenerPool === 'trinity' 
                    ? "Scan a curated pool of top US stocks to find hidden Trinity or Confluence AI opportunities right now."
                    : activeScreenerPool === 'trending'
                    ? "Scan live market trends from the street (top gainers, most actives) and find hidden AI opportunities."
                    : "Scan aggressive, high-growth small-cap stocks (with an adjusted AI curve) to find the next big winners."}
                </div>
                
                {(activeScreenerPool === 'trinity' ? screenerError : activeScreenerPool === 'trending' ? trendingError : smallcapError) && <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{activeScreenerPool === 'trinity' ? screenerError : activeScreenerPool === 'trending' ? trendingError : smallcapError}</div>}
                
                {(activeScreenerPool === 'trinity' ? screenerResults : activeScreenerPool === 'trending' ? trendingResults : smallcapResults).length > 0 ? (
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {(activeScreenerPool === 'trinity' ? screenerResults : activeScreenerPool === 'trending' ? trendingResults : smallcapResults).map((r, i) => (
                      <button 
                        key={i}
                        type="button"
                        onClick={() => {
                          setWatchlistInput(r.symbol);
                          setScreenerTabActive(false);
                        }}
                        className="w-full text-left p-3 bg-fintech-bg border border-fintech-border hover:border-fintech-accent/50 rounded-xl transition-all flex justify-between items-center group"
                      >
                        <div>
                          <div className="font-bold text-white group-hover:text-fintech-accent transition-colors">{r.symbol}</div>
                          <div className="text-xs text-fintech-muted truncate max-w-[150px]">{r.name}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm ${r.isTrinity ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'}`}>
                            {r.isTrinity ? 'TRINITY' : 'CONFLUENCE'}
                          </span>
                          <div className="flex gap-1 text-[9px] text-fintech-muted font-medium">
                            <span className="text-indigo-300">G:{r.garpScore}</span>
                            <span className="text-purple-300">M:{r.moatScore}</span>
                            <span className="text-amber-300">V:{r.valueScore}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-fintech-bg/50 rounded-xl border border-dashed border-fintech-border">
                    <Sparkles size={32} className="text-fintech-accent/30 mb-3" />
                    <p className="text-sm text-fintech-muted text-center">Ready to discover high-quality AI rated stocks?</p>
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowWatchlistModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-fintech-text bg-fintech-bg border border-fintech-border hover:bg-fintech-border transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={activeScreenerPool === 'trinity' ? runTrinityScreener : activeScreenerPool === 'trending' ? runTrendingScreener : runSmallcapScreener}
                    disabled={activeScreenerPool === 'trinity' ? screenerLoading : activeScreenerPool === 'trending' ? trendingLoading : smallcapLoading}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-fintech-accent hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {(activeScreenerPool === 'trinity' ? screenerLoading : activeScreenerPool === 'trending' ? trendingLoading : smallcapLoading) ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                    {(activeScreenerPool === 'trinity' ? screenerLoading : activeScreenerPool === 'trending' ? trendingLoading : smallcapLoading) ? 'Scanning...' : ((activeScreenerPool === 'trinity' ? screenerResults : activeScreenerPool === 'trending' ? trendingResults : smallcapResults).length > 0 ? 'Rescan Market' : 'Scan Market')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company Explanation Modal */}
      {explanationSymbol && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-fintech-card border border-fintech-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300 transform scale-100 flex flex-col animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setExplanationSymbol(null)}
              className="absolute top-4 right-4 text-fintech-muted hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="text-[10px] font-extrabold bg-fintech-accent/20 text-fintech-accent px-3 py-1 rounded-full uppercase tracking-widest w-fit mb-4">
              Company Explanation
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-fintech-accent/10 border border-fintech-accent/20 flex items-center justify-center">
                <Building2 size={24} className="text-fintech-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white leading-tight">
                  {explanationSymbol}
                </h3>
                <p className="text-xs text-fintech-muted truncate max-w-[280px]">
                  {holdings.find(h => h.symbol === explanationSymbol)?.name || 
                   watchlist.find(w => w.symbol === explanationSymbol)?.name || 
                   explanationSymbol}
                </p>
              </div>
            </div>
            <div className="relative border-t border-slate-800/80 pt-4 mt-2 mb-6">
              <div className={`transition-all duration-300 ${isExplanationExpanded ? 'max-h-60 overflow-y-auto pr-2' : ''}`}>
                <p className={`text-slate-300 text-sm leading-relaxed font-medium ${isExplanationExpanded ? '' : 'line-clamp-3'}`}>
                  {holdings.find(h => h.symbol === explanationSymbol)?.explanation || 
                   watchlist.find(w => w.symbol === explanationSymbol)?.explanation ||
                   COMPANY_EXPLANATIONS[explanationSymbol.toUpperCase()] || 
                   "No company explanation is currently configured for this ticker."}
                </p>
              </div>
              <button 
                onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
                className="text-fintech-accent text-xs font-bold mt-2 hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                {isExplanationExpanded ? "Show Less" : "Read More"}
              </button>
            </div>
            <button
              onClick={() => setExplanationSymbol(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-lg border border-slate-700/50"
            >
              Close
            </button>
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
