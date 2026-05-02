"use client";

import React, { useState } from 'react';
import { Pause, Play } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isCustom?: boolean;
}

export default function TickerTape({ items }: { items: TickerItem[] }) {
  const [isManualPaused, setIsManualPaused] = useState(false);

  // Duplicate list for seamless loop
  const displayItems = [...items, ...items];

  return (
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
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-2 px-8 py-1 border-r border-slate-800 transition-colors hover:bg-slate-900/50 ${
                item.isCustom 
                  ? 'border-x border-amber-500/30 bg-amber-500/5 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' 
                  : ''
              }`}
            >
              <span className={`text-sm font-bold ${item.isCustom ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]' : 'text-emerald-400'}`}>
                {item.symbol}
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
  );
}
