import React from 'react';
import './ElectricityGraph.css';
import {
  TrendingUp,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const data = [
  { day: 'Mon', usage: 4200, expected: 4000 },
  { day: 'Tue', usage: 3800, expected: 4100 },
  { day: 'Wed', usage: 4500, expected: 4300 },
  { day: 'Thu', usage: 5200, expected: 4500 },
  { day: 'Fri', usage: 4900, expected: 4800 },
  { day: 'Sat', usage: 4100, expected: 4200 },
  { day: 'Sun', usage: 5800, expected: 4600 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const actual = payload[0].value;
    const expected = payload[1].value;
    const diff = Math.round(((actual - expected) / expected) * 100);

    return (
      <div className="electricity-tooltip">
        <p className="tooltip-label">{label}</p>
        <div className="tooltip-items">
          <div className="tooltip-item actual">
            <span className="dot"></span>
            <span className="name">Current:</span>
            <span className="value">{actual}W</span>
          </div>
          <div className="tooltip-item forecast">
            <span className="dot"></span>
            <span className="name">Expected:</span>
            <span className="value">{expected}W</span>
          </div>
        </div>
        <div className={`tooltip-alert ${diff > 0 ? 'higher' : 'lower'}`}>
          {diff > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(diff)}% {diff > 0 ? 'above' : 'below'} target</span>
        </div>
      </div>
    );
  }
  return null;
};

const ElectricityGraph = () => {
  const lastData = data[data.length - 1];
  const percentDiff = Math.round(((lastData.usage - lastData.expected) / lastData.expected) * 100);
  const totalUsage = data.reduce((sum, item) => sum + item.usage, 0);

  return (
    <div className="electricity-graph-card">
      <div className="graph-header">
        <div className="header-main">
          <div className="title-group">
            <div className="title-icon-wrapper">
              <Zap size={20} />
            </div>
            <h3>Power Consumption Trend (W)</h3>
          </div>
          <div className="metrics-summary">
            <span className={`forecast-badge ${percentDiff > 0 ? 'higher' : 'lower'}`}>
              {percentDiff > 0 ? '+' : ''}{percentDiff}% vs Forecast
            </span>
            <span className="total-label">Weekly Total: {(totalUsage / 1000).toFixed(1)} kWh</span>
          </div>
        </div>
      </div>

      <div className="graph-body">
        <div className="electricity-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3A5A40" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3A5A40" stopOpacity={0} />
                </linearGradient>
                <filter id="powerGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(58, 90, 64, 0.1)" />
              <XAxis
                dataKey="day"
                stroke="#588157"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#588157"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                height={40}
                wrapperStyle={{ fontSize: '12px', fontWeight: '600', paddingBottom: '10px' }}
              />
              <Area
                type="monotone"
                dataKey="usage"
                name="Actual Power"
                stroke="#3A5A40"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPower)"
                filter="url(#powerGlow)"
              />
              <Area
                type="monotone"
                dataKey="expected"
                name="Target Baseline"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ElectricityGraph;
