import React from 'react';
import './Dashboard.css';
import StatCard from '../StatCard/StatCard';
import HistoricalCharts from '../Charts/HistoricalCharts';
import SystemControl from '../SystemControl/SystemControl';
import Alerts from '../Alerts/Alerts';
import PlantGrowth from './PlantGrowth';
import ResourceMetrics from './ResourceMetrics';
import { 
  Thermometer, 
  Droplets, 
  Sprout, 
  FlaskConical, 
  Sun, 
  Wind, 
  ArrowUpRight,
  Search,
  Bell,
  Waves,
  Fan
} from 'lucide-react';

const Dashboard = () => {
  return (
    <main className="dashboard-main">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="back-btn"><ArrowUpRight rotate={-135} size={20} /></div>
          <div className="header-title">
            <h1>System Overview</h1>
            <span className="coordinates">12.3456° S, 76.5432° W • Vertical Lab 01</span>
          </div>
        </div>
        <div className="header-right">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search sensors, crops..." />
          </div>
          <div className="header-stats">
            <div className="mini-stat">
              <span className="mini-label">System Health</span>
              <span className="mini-value success">98%</span>
            </div>
            <div className="mini-stat">
              <span className="mini-label">Water Level</span>
              <span className="mini-value info">85%</span>
            </div>
            <div className="mini-stat">
              <span className="mini-label">Active Alerts</span>
              <span className="mini-value warning">2</span>
            </div>
          </div>
        </div>
      </header>

      <section className="top-summary">
        <div className="summary-cards">
          <StatCard 
            icon={Thermometer} 
            label="Temperature" 
            value="24.5" 
            unit="°C" 
            status="optimal" 
            trend={2} 
          />
          <StatCard 
            icon={Droplets} 
            label="Ambient Humidity" 
            value="62" 
            unit="%" 
            status="optimal" 
            trend={-1} 
          />
          <StatCard 
            icon={Sprout} 
            label="Soil Moisture" 
            value="42" 
            unit="%" 
            status="warning" 
            trend={-5} 
          />
          <StatCard 
            icon={FlaskConical} 
            label="Water pH" 
            value="6.2" 
            unit="pH" 
            status="optimal" 
            trend={0} 
          />
          <StatCard 
            icon={Sun} 
            label="Light Intensity" 
            value="12.5k" 
            unit="lux" 
            status="optimal" 
            trend={12} 
          />
          <StatCard 
            icon={Wind} 
            label="CO2 Levels" 
            value="850" 
            unit="ppm" 
            status="optimal" 
            trend={3} 
          />
          <StatCard 
            icon={Waves} 
            label="Water Level" 
            value="85" 
            unit="%" 
            status="optimal" 
            trend={-2} 
          />
          <StatCard 
            icon={Fan} 
            label="Airflow" 
            value="Optimal" 
            unit="" 
            status="optimal" 
            trend={0} 
          />
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="grid-left">
          <HistoricalCharts />
          <div className="sub-grid">
            <SystemControl />
            <Alerts />
          </div>
        </div>
        <div className="grid-right">
          <PlantGrowth />
          <ResourceMetrics />
          <div className="ai-advisor-card">
            <div className="advisor-header">
              <div className="ai-avatar">🤖</div>
              <h4>AI Growth Insights</h4>
            </div>
            <ul className="advisor-tips">
              <li>💡 Reduce lighting intensity by 10% between 2PM-4PM to save energy.</li>
              <li>🧪 Nutrient mix adjustment recommended for Batch A-04 in 48 hours.</li>
              <li>💧 Water optimization: Current cycle is 95% efficient.</li>
            </ul>
            <button className="advisor-btn">Apply Recommendations</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
