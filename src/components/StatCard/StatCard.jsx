import React from 'react';
import './StatCard.css';

const StatCard = ({ icon: Icon, label, value, unit, status, trend, subtext }) => {
  const getStatusClass = () => {
    if (status === 'optimal') return 'status-optimal';
    if (status === 'warning') return 'status-warning';
    if (status === 'critical') return 'status-critical';
    if (status === 'danger') return 'status-critical'; // Map danger to critical
    if (status === 'active') return 'status-active';
    return '';
  };

  return (
    <div className={`stat-card ${getStatusClass()}`}>
      <div className="stat-card-header">
        <div className="stat-icon-wrapper">
          <Icon size={18} />
        </div>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-card-body">
        <span className="stat-value">{value}</span>
        <span className="stat-unit">{unit}</span>
      </div>
      {subtext && (
        <div className="stat-subtext">{subtext}</div>
      )}
      {trend && (
        <div className={`stat-trend ${trend > 0 ? 'trend-up' : 'trend-down'}`}>
          {trend > 0 ? '+' : ''}{trend}% from yesterday
        </div>
      )}
    </div>
  );
};

export default StatCard;
