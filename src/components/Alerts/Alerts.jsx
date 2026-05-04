import React from 'react';
import { AlertTriangle, Info, CheckCircle2, Clock } from 'lucide-react';
import './Alerts.css';

const alertsData = [
  {
    id: 1,
    severity: 'critical',
    title: 'pH Level Out of Range',
    message: 'Current pH is 4.8. Nutrient uptake may be restricted.',
    time: '5 mins ago',
    action: 'Adjust pH Balancer'
  },
  {
    id: 2,
    severity: 'warning',
    title: 'Low Water Level',
    message: 'Reservoir A is at 15%. Refill scheduled for 18:00.',
    time: '2 hours ago',
    action: 'Check Intake Valve'
  },
  {
    id: 3,
    severity: 'info',
    title: 'Optimal Light Cycle',
    message: 'Plants have reached daily light integral target.',
    time: '4 hours ago',
    action: 'View Report'
  }
];

const Alerts = () => {
  return (
    <div className="alerts-container">
      <div className="card-header">
        <h3>Active Alerts</h3>
        <span className="alerts-count">{alertsData.length}</span>
      </div>
      <div className="alerts-list">
        {alertsData.map(alert => (
          <div key={alert.id} className={`alert-item ${alert.severity}`}>
            <div className="alert-icon">
              {alert.severity === 'critical' && <AlertTriangle size={20} />}
              {alert.severity === 'warning' && <AlertTriangle size={20} />}
              {alert.severity === 'info' && <Info size={20} />}
            </div>
            <div className="alert-content">
              <div className="alert-top">
                <span className="alert-title">{alert.title}</span>
                <span className="alert-time"><Clock size={12} /> {alert.time}</span>
              </div>
              <p className="alert-message">{alert.message}</p>
              <button className="alert-action">{alert.action}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
