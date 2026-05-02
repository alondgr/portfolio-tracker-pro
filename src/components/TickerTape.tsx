"use client";

import React, { useState } from 'react';
import { Pause, Play, X, Info } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isCustom?: boolean;
  description?: string;
}

const DESCRIPTIONS: Record<string, string> = {
  'S&P 500': "Standard & Poor's 500 is a stock market index tracking the performance of 500 of the largest publicly traded companies in the U.S. It is considered a premier indicator of U.S. stock market health.",
  'NASDAQ': "The NASDAQ Composite is a market cap-weighted index of more than 2,500 stocks listed on the Nasdaq stock exchange, heavily weighted towards technology and growth companies.",
  'DOW J': "The Dow Jones Industrial Average is a price-weighted index that tracks 30 large, publicly owned blue-chip companies trading on the New York Stock Exchange and the Nasdaq.",
  'VIX': "The CBOE Volatility Index, or VIX, is a real-time market index representing the market's expectations for volatility over the coming 30 days. It is often called the 'Fear Gauge'.",
  '10Y YIELD': "The 10-Year Treasury Note yield is a key benchmark for interest rates. It reflects investor confidence and influences everything from mortgage rates to corporate borrowing costs.",
  'DXY': "The U.S. Dollar Index (DXY) measures the value of the United States dollar relative to a basket of foreign currencies, including the Euro, Yen, and Pound.",
  'GOLD': "Gold is a precious metal that has served as a store of value for centuries. In finance, it is often seen as a 'safe-haven' asset and a hedge against inflation and currency devaluation.",
  'BTC': "Bitcoin is the world's first decentralized digital currency. It operates on a peer-to-peer network (blockchain) without a central bank or single administrator.",
  'ETH': "Ethereum is a decentralized, open-source blockchain with smart contract functionality. Ether (ETH) is the native cryptocurrency of the platform, second only to Bitcoin in market cap.",
};

export default function TickerTape({ items }: { items: TickerItem[] }) {
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TickerItem | null>(null);

  // Duplicate list for seamless loop
  const displayItems = [...items, ...items];

  const handleItemClick = (item: TickerItem) => {
    // Only show descriptions for known indices/assets
    const description = DESCRIPTIONS[item.symbol];
    if (description) {
      setSelectedItem({ ...item, description });
      setIsManualPaused(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full bg-black border-t border-fintech-border h-10 flex items-center overflow-hidden z-[100] select-none shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        {/* Live Indicator & Pause Toggle */}
        <div className="flex items-center gap-3 px-4 bg-black border-r border-fintech-border h-full z-20">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] ${isManualPaused ? 'bg-slate-600' : 'bg-rose-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Live</span>
          </div>
          <button 
            onClick={() => setIsManualPaused(!isManualPaused)}
            className="text-fintech-muted hover:text-white transition-colors"
            title={isManualPaused ? "Resume" : "Pause"}
          >
            {isManualPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
          </button>
        </div>

        {/* Marquee Content */}
        <div 
          className={`flex items-center animate-marquee whitespace-nowrap ${isManualPaused ? 'pause-animation' : ''}`}
          style={{ animationPlayState: isManualPaused ? 'paused' : undefined }}
        >
          {displayItems.map((item, idx) => {
            const hasSign = item.change.startsWith('+') || item.change.startsWith('-');
            const hasDescription = !!DESCRIPTIONS[item.symbol];
            
            return (
              <div 
                key={idx} 
                onClick={() => handleItemClick(item)}
                className={`flex items-center gap-2 px-8 py-1 border-r border-slate-800 transition-colors hover:bg-slate-900/50 cursor-pointer ${
                  item.isCustom 
                    ? 'border-x border-amber-500/30 bg-amber-500/5 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' 
                    : ''
                } ${hasDescription ? 'hover:text-white' : ''}`}
              >
                <span className={`text-sm font-bold flex items-center gap-1.5 ${item.isCustom ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]' : 'text-emerald-400'}`}>
                  {item.symbol}
                  {hasDescription && <Info size={10} className="opacity-40" />}
                </span>
                <span className="text-white text-xs font-mono">{item.price}</span>
                <span className={`text-[10px] font-bold ${
                  item.change.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {!hasSign && '+'}{item.change}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Popup Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-fintech-card border border-fintech-border rounded-3xl p-6 shadow-2xl transform animate-in slide-in-from-bottom-10 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-2xl font-bold text-white mb-1">{selectedItem.symbol}</h4>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono text-slate-300">{selectedItem.price}</span>
                  <span className={`text-sm font-bold ${selectedItem.change.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedItem.change.startsWith('-') ? '' : '+'}{selectedItem.change}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-300 leading-relaxed text-sm bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              {selectedItem.description}
            </p>
            
            <button 
              onClick={() => setSelectedItem(null)}
              className="w-full mt-6 py-3 bg-fintech-accent text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg"
            >
              Got it
            </button>
          </div>
          {/* Overlay click to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedItem(null)}></div>
        </div>
      )}
    </>
  );
}
