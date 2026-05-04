import React from 'react';
import { Calendar, Target, TrendingUp, Info } from 'lucide-react';
import './PlantGrowth.css';

const PlantGrowth = () => {
  return (
    <div className="plant-growth-card">
      <div className="plant-hero">
        <div className="plant-image">
          <img src="https://images.unsplash.com/photo-1621990102962-d963032b4931?auto=format&fit=crop&q=80&w=200&h=200" alt="Lettuce" />
        </div>
        <div className="plant-primary-info">
          <div className="status-badge">Healthy</div>
          <h2>Butterhead Lettuce</h2>
          <p className="field-location">Vertical Rack A-04</p>
        </div>
      </div>

      <div className="growth-stats">
        <div className="growth-stat-item">
          <Calendar size={18} />
          <div className="stat-details">
            <span className="label">Days Since Planting</span>
            <span className="value">18 Days</span>
          </div>
        </div>
        <div className="growth-stat-item">
          <TrendingUp size={18} />
          <div className="stat-details">
            <span className="label">Growth Stage</span>
            <span className="value">Vegetative</span>
          </div>
        </div>
        <div className="growth-stat-item">
          <Target size={18} />
          <div className="stat-details">
            <span className="label">Exp. Harvest</span>
            <span className="value">May 24, 2026</span>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span>Overall Growth Progress</span>
          <span>65%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: '65%' }}></div>
        </div>
      </div>

      <div className="target-conditions">
        <h4>Target Conditions</h4>
        <div className="targets-grid">
          <div className="target-pill">Temp: 22-24°C</div>
          <div className="target-pill">pH: 5.5-6.5</div>
          <div className="target-pill">Humidity: 60-70%</div>
          <div className="target-pill">Light: 16h/day</div>
        </div>
      </div>
    </div>
  );
};

export default PlantGrowth;
