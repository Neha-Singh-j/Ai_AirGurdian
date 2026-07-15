import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { PredictionPoint } from '../../types';
import { getAqiColor } from '../../utils/aqi';

const CHART_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#7c3aed', '#581c87'];

interface PredictionChartProps {
  predictions: PredictionPoint[];
  currentAqi: number;
}

export function PredictionChart({ predictions, currentAqi }: PredictionChartProps) {
  const data = [
    { name: 'Now', aqi: currentAqi, confidence: 1 },
    ...predictions.map((p) => ({
      name: `${p.hours_ahead}h`,
      aqi: p.aqi,
      confidence: p.confidence,
    })),
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} domain={[0, 'auto']} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          formatter={(value: number) => [`AQI ${value}`, 'AQI']}
        />
        <Line
          type="monotone"
          dataKey="aqi"
          stroke="#2563eb"
          strokeWidth={3}
          dot={{ fill: '#2563eb', r: 6 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface HourlyTrendChartProps {
  data: { hour: string; aqi: number; pm25: number }[];
}

export function HourlyTrendChart({ data }: HourlyTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="hour" stroke="#64748b" fontSize={11} interval={2} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip contentStyle={{ borderRadius: '8px' }} />
        <Line type="monotone" dataKey="aqi" stroke="#ef4444" strokeWidth={2} name="AQI" dot={false} />
        <Line type="monotone" dataKey="pm25" stroke="#3b82f6" strokeWidth={2} name="PM2.5" dot={false} />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface SourceChartProps {
  sources: { source: string; percentage: number; confidence: number }[];
}

export function SourceChart({ sources }: SourceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sources} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#64748b" fontSize={12} unit="%" />
        <YAxis dataKey="source" type="category" stroke="#64748b" fontSize={11} width={120} />
        <Tooltip
          contentStyle={{ borderRadius: '8px' }}
          formatter={(value: number, _name: string, props: { payload?: { confidence: number } }) => [
            `${value}% (confidence: ${((props.payload?.confidence ?? 0) * 100).toFixed(0)}%)`,
            'Contribution',
          ]}
        />
        <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
          {sources.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CategoryPieChartProps {
  data: { category: string; count: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ category, count }) => `${category}: ${count}`}
          labelLine={false}
          fontSize={10}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface WhatIfChartProps {
  timeline: { hour: number; aqi: number }[];
  baseline: number;
}

export function WhatIfChart({ timeline, baseline }: WhatIfChartProps) {
  const data = timeline.map((t) => ({ hour: `${t.hour}h`, aqi: t.aqi }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} domain={[0, 'auto']} />
        <Tooltip contentStyle={{ borderRadius: '8px' }} />
        <Line
          type="monotone"
          dataKey="aqi"
          stroke="#22c55e"
          strokeWidth={3}
          dot={{ fill: '#22c55e', r: 5 }}
          name="Projected AQI"
        />
        {/* Baseline reference */}
        <Line
          type="monotone"
          data={data.map((d) => ({ ...d, baseline }))}
          dataKey="baseline"
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Baseline"
        />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}
