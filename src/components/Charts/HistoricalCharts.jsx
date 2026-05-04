import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import './HistoricalCharts.css';

const data = [
  { time: '00:00', temp: 22, humidity: 65, moisture: 40 },
  { time: '04:00', temp: 20, humidity: 70, moisture: 38 },
  { time: '08:00', temp: 24, humidity: 60, moisture: 35 },
  { time: '12:00', temp: 28, humidity: 55, moisture: 42 },
  { time: '16:00', temp: 26, humidity: 58, moisture: 45 },
  { time: '20:00', temp: 23, humidity: 62, moisture: 43 },
  { time: '23:59', temp: 21, humidity: 68, moisture: 41 },
];

const HistoricalCharts = () => {
  return (
    <div className="charts-grid">
      <div className="chart-container">
        <div className="chart-header">
          <h3>Temperature Trends (°C)</h3>
          <select className="chart-select">
            <option>Last 24 Hours</option>
            <option>Last Week</option>
          </select>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#76A34A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#76A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
              <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="temp" 
                stroke="#76A34A" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTemp)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3>Soil Moisture & Humidity (%)</h3>
          <div className="chart-legend">
            <span className="legend-item"><span className="dot moisture"></span> Moisture</span>
            <span className="legend-item"><span className="dot humidity"></span> Humidity</span>
          </div>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
              <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                }} 
              />
              <Line type="monotone" dataKey="moisture" stroke="#2D5A27" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="humidity" stroke="#D4E157" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HistoricalCharts;
