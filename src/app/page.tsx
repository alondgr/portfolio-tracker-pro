"use client";

import React, { useEffect, useState } from 'react';
import AllocationCharts from '@/components/AllocationCharts';
import { Plus, TrendingUp, TrendingDown, RefreshCw, AlertCircle, RefreshCcw, ArrowUpDown, ChevronUp, ChevronDown, Trash2, Edit2 } from 'lucide-react';

const HATEFUL_8 = ['NVDA', 'PLTR', 'COIN', 'CRCL', 'GOLD', 'OXY', 'B', 'NEE', 'IRM'];

export default function Dashboard() {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHateful8, setShowHateful8] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Row expansion state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Main Modal state (for fresh additions only now)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ symbol: '', quantity: '', avgBuyPrice: '', date: new Date().toISOString().split('T')[0] });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Inline Transaction Form state
  const [txnFormActiveSymbol, setTxnFormActiveSymbol] = useState<string | null>(null);
  const [txnForm, setTxnForm] = useState({ type: 'BUY', quantity: '', price: '', date: new Date().toISOString().split('T')[0] });

  // Inline Edit Transaction state
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
  const [editTxnForm, setEditTxnForm] = useState({ type: 'BUY', quantity: '', price: '', date: '' });

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setHoldings(data.holdings || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const toggleRow = (symbol: string) => {
    setExpandedRows(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  // Add a brand new stock
  const handleAddFreshHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
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
      await fetchPortfolio();
      setShowModal(false);
      setFormData({ symbol: '', quantity: '', avgBuyPrice: '', date: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditTransactionSubmit = async (e: React.FormEvent, symbol: string) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
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
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteTransaction', symbol, transactionId }),
      });
      if (!res.ok) throw new Error('Failed to delete transaction');
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

  // Calculate totals
  const totalMarketValue = filteredHoldings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
  const totalCostBasis = filteredHoldings.reduce((sum, h) => sum + (h.avgBuyPrice * h.quantity), 0);
  // Realized P/L is extremely hard to calculate accurately without complex FIFO handling, so we rely on Unrealized against open cost basis.
  const totalUnrealizedPL = totalMarketValue - totalCostBasis;
  const totalYieldSum = filteredHoldings.reduce((sum, h) => sum + ((h.yieldPct || 0) * (h.marketValue || 0)), 0);
  const avgYield = totalMarketValue > 0 ? (totalYieldSum / totalMarketValue) : 0;

  const isProfit = totalUnrealizedPL >= 0;

  const SortableHeader = ({ label, sortKey, alignRight = false, alignCenter = false }: { label: string, sortKey: string, alignRight?: boolean, alignCenter?: boolean }) => {
    return (
      <th
        className={`p-5 font-semibold cursor-pointer select-none group hover:text-white transition-colors ${alignRight ? 'text-right' : alignCenter ? 'text-center' : ''}`}
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
    <div className="min-h-screen p-6 md:p-12 font-sans bg-fintech-bg text-fintech-text selection:bg-fintech-accent selection:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fintech-accent to-emerald-400">
            Portfolio Tracker
          </h1>
          <p className="text-fintech-muted mt-2">Real-time insights and analytics.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowHateful8(!showHateful8)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-300 border ${showHateful8
              ? 'bg-fintech-accent border-fintech-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
              : 'bg-fintech-card border-fintech-border text-fintech-text hover:bg-fintech-border'
              }`}
          >
            Hateful 8 View
          </button>
          <button
            onClick={fetchPortfolio}
            className="p-2 rounded-full bg-fintech-card border border-fintech-border hover:bg-fintech-border transition-colors flex items-center justify-center text-fintech-text"
            title="Refresh Data"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin text-fintech-accent' : ''} />
          </button>
          <button
            onClick={() => {
              setFormData({ symbol: '', quantity: '', avgBuyPrice: '', date: new Date().toISOString().split('T')[0] });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-fintech-profit hover:bg-emerald-600 text-white rounded-full font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <Plus size={18} /> New Stock
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-fintech-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10">Total Value</p>
          <h2 className="text-3xl font-bold text-white relative z-10">
            ${totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>

        <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br from-${isProfit ? 'fintech-profit' : 'fintech-loss'}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          <p className="text-fintech-muted font-medium mb-1 relative z-10">Open Unrealized P/L</p>
          <div className="flex items-end gap-3 relative z-10">
            <h2 className={`text-3xl font-bold ${isProfit ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
              {isProfit ? '+' : ''}${totalUnrealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          {/* Table */}
          <div className="bg-fintech-card border border-fintech-border rounded-2xl shadow-xl overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-fintech-bg/50 border-b border-fintech-border text-fintech-muted text-sm uppercase tracking-wider">
                    <th className="p-5 font-semibold w-12 text-center">#</th>
                    <SortableHeader label="Symbol" sortKey="symbol" />
                    <SortableHeader label="Shares" sortKey="quantity" alignCenter />
                    <SortableHeader label="Avg Price" sortKey="avgBuyPrice" alignRight />
                    <SortableHeader label="Current Price" sortKey="currentPrice" alignRight />
                    <SortableHeader label="Market Value" sortKey="marketValue" alignRight />
                    <SortableHeader label="Unrealized P/L" sortKey="unrealizedPL" alignRight />
                    <SortableHeader label="Div Yield" sortKey="yieldPct" alignRight />
                    <SortableHeader label="Sector" sortKey="sector" />
                    <SortableHeader label="Industry" sortKey="industry" />
                    <th className="p-5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fintech-border">
                  {sortedHoldings.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-fintech-muted">
                        No holdings found. Click "New Stock" to start tracking.
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
                            <td className="p-5 text-center text-fintech-muted font-medium w-12">{i + 1}</td>
                            <td className="p-5">
                              <div className="font-bold text-white">{h.symbol}</div>
                              <div className="text-xs text-fintech-muted opacity-80 mt-0.5">{h.name}</div>
                            </td>
                            <td className="p-5 text-center font-medium px-8">{h.quantity}</td>
                            <td className="p-5 text-right text-fintech-muted">${h.avgBuyPrice?.toFixed(2)}</td>
                            <td className="p-5 text-right font-medium">${h.currentPrice?.toFixed(2) || 'N/A'}</td>
                            <td className="p-5 text-right font-semibold text-white">
                              <div className="flex flex-col items-end">
                                <span>${h.marketValue ? h.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
                                <span className="text-sm font-medium text-fintech-accent mt-0.5 tracking-wide">
                                  {totalMarketValue > 0 && h.marketValue ? ((h.marketValue / totalMarketValue) * 100).toFixed(2) : '0.00'}%
                                </span>
                              </div>
                            </td>
                            <td className={`p-5 text-right font-bold ${isRowProfit ? 'text-fintech-profit' : 'text-fintech-loss'}`}>
                              <div className="flex flex-col items-end">
                                <span>{isRowProfit ? '+' : ''}${h.unrealizedPL ? h.unrealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
                                <span className="text-sm opacity-80">{isRowProfit ? '+' : ''}{(h.unrealizedPLPercent || 0).toFixed(2)}%</span>
                              </div>
                            </td>
                            <td className="p-5 text-right text-fintech-muted">{(h.yieldPct || 0).toFixed(2)}%</td>
                            <td className="p-5 text-sm text-fintech-muted truncate max-w-[130px]" title={h.sector}>{h.sector || 'Unknown'}</td>
                            <td className="p-5 text-sm text-fintech-muted truncate max-w-[130px]" title={h.industry}>{h.industry || 'Unknown'}</td>
                            <td className="p-5 text-center text-fintech-muted">
                              <button className="p-2 rounded-full hover:bg-fintech-border transition-colors">
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Transaction Ledger Row */}
                          {isExpanded && (
                            <tr className="bg-fintech-bg/50 border-b border-fintech-border">
                              <td colSpan={11} className="p-6">
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
                                            <td className="py-2 px-4 text-right text-slate-300">{t.quantity}</td>
                                            <td className="py-2 px-4 text-right text-slate-400">${Number(t.price).toFixed(2)}</td>
                                            <td className="py-2 px-4 text-right text-slate-300 border-l border-slate-700/50 font-medium">
                                              ${(t.quantity * t.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                  <span>{isClosedProfit ? '+' : ''}${Math.abs(h.realizedPL || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                                <td className="py-2 px-4 text-right text-slate-400">${Number(t.price).toFixed(2)}</td>
                                                <td className="py-2 px-4 text-right text-slate-300 border-l border-slate-700/50 font-medium">
                                                  ${(t.quantity * t.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <div>
                <label className="block text-sm font-medium text-fintech-muted mb-1">Symbol (e.g. MSFT)</label>
                <input
                  type="text" required
                  value={formData.symbol}
                  onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className="w-full bg-fintech-bg border border-fintech-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fintech-accent transition-all uppercase"
                  placeholder="MSFT"
                />
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
    </div>
  );
}
