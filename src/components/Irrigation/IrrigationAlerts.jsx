import React from 'react';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { AlertTriangle, Droplet } from 'lucide-react';
import './IrrigationTab.css'; // We will create a unified CSS file

const IrrigationAlerts = () => {
  const { alerts, acknowledgeAlert } = useIrrigationContext();

  if (alerts.length === 0) return null;

  return (
    <div className="irrigation-alerts-container">
      {alerts.map(alert => (
        <div key={alert.id} className={`irrigation-alert-banner ${alert.severity}`}>
          <div className="alert-content">
            <AlertTriangle className="alert-icon" size={20} />
            <span className="alert-message">{alert.message}</span>
          </div>
          <button className="alert-ack-btn" onClick={() => acknowledgeAlert(alert.id)}>
            Acknowledge
          </button>
        </div>
      ))}
    </div>
  );
};

export default IrrigationAlerts;
