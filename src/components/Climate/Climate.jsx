import React from 'react';
import './Climate.css';
import { 
  Thermometer, 
  CloudSun, 
  Wind, 
  Sun,
  Activity,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import StatCard from '../StatCard/StatCard';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { time: '00:00', temp: 22, humidity: 65, co2: 800 },
  { time: '04:00', temp: 20, humidity: 70, co2: 820 },
  { time: '08:00', temp: 24, humidity: 60, co2: 850 },
  { time: '12:00', temp: 28, humidity: 55, co2: 900 },
  { time: '16:00', temp: 26, humidity: 58, co2: 880 },
  { time: '20:00', temp: 23, humidity: 62, co2: 840 },
];

const Climate = () => {
  return (
    <div className="climate-view">
      <header className="view-header">
        <h1>Climate & Environment</h1>
        <p>Real-time atmospheric monitoring and HVAC system control.</p>
      </header>

      <div className="climate-stats">
        <StatCard icon={Thermometer} label="Temperature" value="24.5" unit="°C" status="optimal" />
        <StatCard icon={CloudSun} label="Humidity" value="62" unit="%" status="optimal" />
        <StatCard icon={Wind} label="CO2 Level" value="850" unit="ppm" status="optimal" />
        <StatCard icon={Sun} label="Light (PAR)" value="450" unit="μmol" status="optimal" />
      </div>

      <div className="climate-grid">
        <div className="main-chart-card">
          <h3>Environmental Trends (24h)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temp" stroke="#FF5722" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="humidity" stroke="#2196F3" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="co2" stroke="#4CAF50" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="control-panel">
          <div className="panel-header">
            <h3>HVAC Control</h3>
            <span className="power-tag"><Zap size={14} /> 0.8 kW</span>
          </div>
          <div className="hvac-controls">
            {[
              { label: 'Exhaust Fans', status: 'Active', speed: '60%' },
              { label: 'Intake Fans', status: 'Active', speed: '40%' },
              { label: 'Cooling Pad', status: 'Inactive', speed: '0%' },
              { label: 'CO2 Generator', status: 'Active', speed: 'Auto' },
            ].map((item, i) => (
              <div key={i} className="hvac-item">
                <div className="hvac-info">
                  <span className="hvac-label">{item.label}</span>
                  <span className="hvac-status">{item.status}</span>
                </div>
                <div className="hvac-value">{item.speed}</div>
              </div>
            ))}
          </div>
          <button className="optimize-btn">Run AI Optimization</button>
        </div>
      </div>
    </div>
  );
};

export default Climate;
