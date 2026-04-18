"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type ChartData = { name: string; value: number };

const COLORS = [
  '#3B82F6', '#10B981', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B', '#14B8A6', '#06B6D4',
  '#EAB308', '#84CC16', '#22C55E', '#0EA5E9', '#D946EF', '#9333EA', '#F97316', '#EF4444', '#10B981'
];

export default function AllocationCharts({ holdings }: { holdings: any[] }) {
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

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.04) return null; // Hide label if segment is smaller than 4%
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold" className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
      <div className="bg-fintech-card border border-fintech-border rounded-2xl p-6 shadow-xl flex flex-col items-center">
        <h3 className="text-lg font-semibold text-fintech-text mb-4">Sector Allocation</h3>
        {sectorData.length > 0 ? (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Unknown' ? '#475569' : COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
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
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Unknown' ? '#475569' : COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
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
