import React from 'react';
import './Irrigation.css';
import { 
  Droplets, 
  Waves, 
  Activity, 
  Calendar, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FlaskConical
} from 'lucide-react';
import StatCard from '../StatCard/StatCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { day: 'Mon', usage: 45 },
  { day: 'Tue', usage: 52 },
  { day: 'Wed', usage: 48 },
  { day: 'Thu', usage: 61 },
  { day: 'Fri', usage: 55 },
  { day: 'Sat', usage: 42 },
  { day: 'Sun', usage: 50 },
];

const Irrigation = () => {
  return (
    <div className="irrigation-view">
      <header className="view-header">
        <h1>Irrigation Management</h1>
        <p>Monitor water quality, reservoir levels, and automated pump schedules.</p>
      </header>

      <div className="irrigation-stats">
        <StatCard icon={Waves} label="Reservoir Level" value="85" unit="%" status="optimal" />
        <StatCard icon={FlaskConical} label="Water pH" value="6.2" unit="pH" status="optimal" />
        <StatCard icon={Droplets} label="Soil Moisture" value="42" unit="%" status="warning" />
        <StatCard icon={Activity} label="Pump Status" value="Idle" unit="" status="optimal" />
      </div>

      <div className="irrigation-grid">
        <div className="usage-chart-card">
          <div className="card-header">
            <h3>Water Consumption (L)</h3>
            <span className="total-usage">Total Week: 353L</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="usage" stroke="#2196F3" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="schedule-card">
          <h3>Irrigation Schedule</h3>
          <div className="schedule-list">
            {[
              { time: '06:00 AM', duration: '15 min', zone: 'Zone A', status: 'Completed' },
              { time: '12:00 PM', duration: '10 min', zone: 'Zone B', status: 'Completed' },
              { time: '06:00 PM', duration: '15 min', zone: 'Zone A', status: 'Upcoming' },
              { time: '10:00 PM', duration: '05 min', zone: 'All Zones', status: 'Upcoming' },
            ].map((item, index) => (
              <div key={index} className="schedule-item">
                <div className="time-info">
                  <Clock size={16} />
                  <span>{item.time}</span>
                </div>
                <div className="zone-info">
                  <span className="zone">{item.zone}</span>
                  <span className="duration">{item.duration}</span>
                </div>
                <span className={`status-tag ${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
            ))}
          </div>
          <button className="add-schedule-btn">Update Schedule <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
};

export default Irrigation;
