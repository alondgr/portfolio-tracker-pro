"use client";

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function PerformanceChart({ data, hideValues, currencySymbol = '$' }: { data: any[], hideValues: boolean, currencySymbol?: string }) {
  if (!data || data.length === 0) return (
    <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl mb-8 h-80 flex items-center justify-center text-fintech-muted italic">
      No performance history available yet.
    </div>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-fintech-card p-4 border border-fintech-border rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-fintech-muted text-xs mb-1 uppercase tracking-wider">{payload[0].payload.fullDate}</p>
          <p className="text-xl font-bold text-white">
            {hideValues ? '****' : `${currencySymbol}${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-fintech-text uppercase tracking-widest opacity-80">Portfolio Performance</h3>
        <div className="text-xs text-fintech-muted">Total Market Value Over Time</div>
      </div>
      
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => hideValues ? '****' : `${currencySymbol}${val.toLocaleString()}`}
              width={hideValues ? 40 : 80}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
