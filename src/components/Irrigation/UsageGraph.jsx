import React from 'react';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { TrendingUp, Activity } from 'lucide-react';
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

// In a real app, this would be historical + forecast array from context
const historicalData = [
  { day: 'Mon', usage: 145, expected: 142 },
  { day: 'Tue', usage: 152, expected: 138 },
  { day: 'Wed', usage: 148, expected: 155 },
  { day: 'Thu', usage: 161, expected: 145 },
  { day: 'Fri', usage: 155, expected: 160 },
  { day: 'Sat', usage: 142, expected: 148 },
  { day: 'Sun', usage: 172, expected: 152 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <div className="tooltip-items">
          <div className="tooltip-item actual">
            <span className="dot" style={{backgroundColor: '#2196F3'}}></span>
            <span className="name">Actual:</span>
            <span className="value">{payload[0].value}L</span>
          </div>
          <div className="tooltip-item forecast">
            <span className="dot" style={{backgroundColor: '#94a3b8'}}></span>
            <span className="name">Expected:</span>
            <span className="value">{payload[1].value}L</span>
          </div>
        </div>
        {payload[0].value > payload[1].value && (
          <div className="tooltip-alert" style={{color: '#ef4444', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px'}}>
            <TrendingUp size={12} style={{marginRight: '4px'}}/>
            <span>{Math.round(((payload[0].value - payload[1].value) / payload[1].value) * 100)}% above forecast</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const UsageGraph = () => {
  const { usageStats } = useIrrigationContext();
  const lastData = historicalData[historicalData.length - 1];
  const percentDiff = Math.round(((lastData.usage - lastData.expected) / lastData.expected) * 100);

  return (
    <div className="usage-chart-card">
      <div className="card-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <div className="header-title-group" style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <Activity size={20} color="#2196F3" />
          <h3 style={{margin: 0, color: '#0f172a'}}>Water Consumption (L)</h3>
          <span className={`forecast-badge ${percentDiff > 0 ? 'higher' : 'lower'}`} style={{
            padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
            backgroundColor: percentDiff > 0 ? '#fee2e2' : '#dcfce7',
            color: percentDiff > 0 ? '#b91c1c' : '#15803d'
          }}>
            {percentDiff > 0 ? '+' : ''}{percentDiff}% vs Expected
          </span>
        </div>
        <span className="total-usage" style={{fontWeight: 'bold', color: '#64748b'}}>
          Today: {usageStats.todayL.toFixed(1)}L | Week: {usageStats.weekL.toFixed(1)}L
        </span>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="day" 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              height={50}
              wrapperStyle={{ fontSize: '12px', fontWeight: '600' }}
            />
            <Area 
              type="monotone" 
              dataKey="usage" 
              name="Actual Usage"
              stroke="#2196F3" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorUsage)" 
              filter="url(#glow)"
            />
            <Area 
              type="monotone" 
              dataKey="expected" 
              name="Forecasted"
              stroke="#94a3b8" 
              strokeWidth={2} 
              strokeDasharray="6 6" 
              fill="none" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsageGraph;
