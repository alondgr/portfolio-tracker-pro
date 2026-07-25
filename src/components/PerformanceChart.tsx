"use client";

import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Info } from 'lucide-react';

export default function PerformanceChart({ data, hideValues, currencySymbol = '$' }: { data: any[], hideValues: boolean, currencySymbol?: string }) {
  if (!data || data.length === 0) return (
    <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl mb-8 h-80 flex items-center justify-center text-fintech-muted italic">
      No performance history available yet.
    </div>
  );

  const latestData = data[data.length - 1];
  const portFinalReturn = latestData?.portfolioReturn || 0;
  const sp500FinalReturn = latestData?.sp500Return || 0;
  const delta = portFinalReturn - sp500FinalReturn;
  const isOutperforming = delta >= 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-fintech-card p-4 border border-fintech-border rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-fintech-muted text-xs mb-2 uppercase tracking-wider">{dataPoint.fullDate}</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <p className="text-sm text-fintech-muted">TWR:</p>
              <p className="text-base font-bold text-white">
                {hideValues ? '****' : `${dataPoint.portfolioReturn > 0 ? '+' : ''}${dataPoint.portfolioReturn.toFixed(2)}%`}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <p className="text-sm text-fintech-muted">Value:</p>
              <p className="text-base font-bold text-white">
                 {hideValues ? '****' : `${currencySymbol}${dataPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
            {dataPoint.sp500Return !== undefined && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <p className="text-sm text-fintech-muted">S&P 500:</p>
                <p className="text-base font-bold text-white">
                  {dataPoint.sp500Return > 0 ? '+' : ''}{dataPoint.sp500Return.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-fintech-text uppercase tracking-widest opacity-80">Portfolio Performance</h3>
            <div className="group relative flex items-center">
              <Info className="w-4 h-4 text-fintech-muted cursor-help hover:text-white transition-colors" />
              
              <div className="absolute left-6 top-0 md:left-0 md:top-full mt-1 md:mt-2 w-[280px] md:w-96 bg-fintech-bg border border-fintech-border rounded-xl p-4 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                <h4 className="font-bold text-white mb-2 text-sm border-b border-fintech-border pb-2">Chart Metrics Guide</h4>
                <div className="space-y-3 text-xs text-fintech-muted leading-relaxed">
                  <p><strong className="text-blue-400 font-medium">Time-Weighted Return (TWR):</strong> Measures your compound rate of growth, stripping out the effects of cash deposits/withdrawals to show your true investment skill.</p>
                  <p><strong className="text-emerald-400 font-medium">Cumulative Wealth:</strong> The absolute total monetary value of your portfolio over time, tracked on the right axis.</p>
                  <p><strong className="text-slate-300 font-medium">S&P 500 Benchmark:</strong> A standard index tracking 500 large U.S. companies, used as a baseline to compare performance.</p>
                  <p><strong className="text-white font-medium">Alpha (Outperformance):</strong> The difference between your TWR and the S&P 500. A positive Alpha means you're beating the market!</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-fintech-muted mt-1">Time-Weighted Return (TWR) vs Cumulative Wealth</div>
        </div>
        <div 
          className="group relative flex items-center gap-3 text-sm bg-fintech-bg/50 px-3 py-2 rounded-lg border border-fintech-border/50 cursor-pointer hover:bg-fintech-bg/80 transition-colors"
          tabIndex={0}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-white font-medium">{portFinalReturn > 0 ? '+' : ''}{portFinalReturn.toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-fintech-border pl-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
            <span className="text-white font-medium">{sp500FinalReturn > 0 ? '+' : ''}{sp500FinalReturn.toFixed(2)}%</span>
          </div>
          <div className={`flex items-center gap-1.5 border-l border-fintech-border pl-3 font-bold ${isOutperforming ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span>{isOutperforming ? 'Alpha:' : 'Lagging:'} {delta > 0 ? '+' : ''}{delta.toFixed(2)}%</span>
          </div>
          
          {/* Tooltip Popover */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-fintech-bg border border-fintech-border rounded-xl p-4 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible focus:opacity-100 focus:visible group-focus:opacity-100 group-focus:visible transition-all z-50 pointer-events-none text-left">
            <h4 className="font-bold text-white mb-2 text-sm border-b border-fintech-border pb-2">What does this mean?</h4>
            <div className="space-y-3 text-xs text-fintech-muted leading-relaxed">
              <p><strong className="text-blue-400">Blue Dot:</strong> Your portfolio's return (TWR).</p>
              <p><strong className="text-slate-300">Gray Dot:</strong> S&P 500 Index return.</p>
              <p><strong className={isOutperforming ? 'text-emerald-400' : 'text-rose-400'}>
                {isOutperforming ? 'Alpha' : 'Lagging'}:
              </strong> You are {isOutperforming ? 'beating' : 'lagging behind'} the S&P 500 index by {Math.abs(delta).toFixed(2)}%.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              minTickGap={30}
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
              width={typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 50}
              dx={-10}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
              width={typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 50}
              dx={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="portfolioReturn" 
              stroke="#3B82F6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sp500Return"
              stroke="#94a3b8" // slate-400
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
              animationDuration={1500}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="value"
              stroke="#10b981" // emerald-500
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
