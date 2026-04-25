"use client";

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

type ChartData = { name: string; value: number };

const COLORS = [
  '#3B82F6', '#10B981', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B', '#14B8A6', '#06B6D4',
  '#EAB308', '#84CC16', '#22C55E', '#0EA5E9', '#D946EF', '#9333EA', '#F97316', '#EF4444', '#10B981'
];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold" className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, percent } = props;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={fill}
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
        />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
        opacity={0.3}
      />
      {percent >= 0.04 && (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold" className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      )}
    </g>
  );
};

export default function AllocationCharts({ holdings }: { holdings: any[] }) {
  const [activeSectorIndex, setActiveSectorIndex] = useState<number | null>(null);
  const [activeIndustryIndex, setActiveIndustryIndex] = useState<number | null>(null);

  const renderLegend = (props: any, activeIndex: number | null) => {
    const { payload } = props;
    if (!payload) return null;
    
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-4 text-[11px]">
        {payload.map((entry: any, index: number) => (
          <li 
            key={`item-${index}`} 
            className={`flex items-center gap-1.5 transition-all duration-300 ${index === activeIndex ? 'scale-110 font-bold text-white' : 'text-slate-400 opacity-70'}`}
          >
            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: entry.color }} />
            <span className="truncate max-w-[100px]">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };
  // Aggregate data for Sector
  const sectorMap: Record<string, number> = {};
  // Aggregate data for Industry
  const industryMap: Record<string, number> = {};

  holdings.forEach(h => {
    const value = h.marketValue || 0;
    if (value <= 0) return;
    
    // Sector
    const s = h.sector || 'Unknown';
    sectorMap[s] = (sectorMap[s] || 0) + value;
    
    // Industry
    const i = h.industry || 'Unknown';
    industryMap[i] = (industryMap[i] || 0) + value;
  });

  const sectorData: ChartData[] = Object.keys(sectorMap).map(k => ({ name: k, value: sectorMap[k] }));
  const industryData: ChartData[] = Object.keys(industryMap).map(k => ({ name: k, value: industryMap[k] }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-fintech-card p-3 border border-fintech-border rounded-lg shadow-lg text-sm">
          <p className="text-fintech-text font-semibold">{payload[0].name}</p>
          <p className="text-fintech-muted">Value: ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
      <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl flex flex-col items-center">
        <h3 className="text-lg font-semibold text-fintech-text mb-4">Sector Allocation</h3>
        {sectorData.length > 0 ? (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveSectorIndex(index)}
                  onMouseLeave={() => setActiveSectorIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Unknown' ? '#475569' : COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={(props) => renderLegend(props, activeSectorIndex)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-fintech-muted">No data available</div>
        )}
      </div>

      <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl flex flex-col items-center">
        <h3 className="text-lg font-semibold text-fintech-text mb-4">Industry Allocation</h3>
        {industryData.length > 0 ? (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndustryIndex(index)}
                  onMouseLeave={() => setActiveIndustryIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Unknown' ? '#475569' : COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={(props) => renderLegend(props, activeIndustryIndex)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-fintech-muted">No data available</div>
        )}
      </div>
    </div>
  );
}
