import React from 'react';
import { Droplets, Zap, Leaf, Activity } from 'lucide-react';
import './ResourceMetrics.css';

const ResourceMetrics = () => {
  return (
    <div className="resource-card">
      <div className="card-header">
        <h3>Resource Efficiency</h3>
        <Activity size={18} color="var(--primary-green)" />
      </div>
      
      <div className="metrics-grid">
        <div className="metric-box">
          <div className="metric-icon water"><Droplets size={20} /></div>
          <div className="metric-data">
            <span className="metric-value">450L</span>
            <span className="metric-label">Water Used (Week)</span>
          </div>
          <div className="metric-change negative">-12%</div>
        </div>

        <div className="metric-box">
          <div className="metric-icon energy"><Zap size={20} /></div>
          <div className="metric-data">
            <span className="metric-value">128 kWh</span>
            <span className="metric-label">Energy Consumption</span>
          </div>
          <div className="metric-change positive">+5%</div>
        </div>

        <div className="metric-box">
          <div className="metric-icon carbon"><Leaf size={20} /></div>
          <div className="metric-data">
            <span className="metric-value">42 kg</span>
            <span className="metric-label">CO2 Saved</span>
          </div>
          <div className="metric-change negative">-8%</div>
        </div>
      </div>

      <div className="efficiency-score">
        <div className="score-circle">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="circle" strokeDasharray="92, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <text x="18" y="20.35" className="percentage">92</text>
          </svg>
        </div>
        <div className="score-info">
          <h5>Efficiency Score</h5>
          <p>AI-calculated sustainability metric based on resource optimization.</p>
        </div>
      </div>
    </div>
  );
};

export default ResourceMetrics;
