import React, { useEffect, useState } from 'react';
import { useElectricityContext } from '../../context/ElectricityContext';
import { AlertTriangle, Info, BellRing } from 'lucide-react';

const AlertBanners = () => {
  const { deviceRegistry, acknowledgeAlert } = useElectricityContext();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const alerts = Object.keys(deviceRegistry)
    .map(id => ({ id, ...deviceRegistry[id] }))
    .filter(d => d.alert);

  if (alerts.length === 0) return null;

  return (
    <div className="alert-banners-container">
      {alerts.map(device => {
        const { type, message } = device.alert;
        const Icon = type === 'breach' || type === 'danger' ? AlertTriangle : (type === 'warning' ? BellRing : Info);
        
        let countdownText = null;
        if (device.countdownStartedAt && device.countdownDuration) {
          const elapsed = now - device.countdownStartedAt;
          const remaining = Math.max(0, Math.ceil((device.countdownDuration - elapsed) / 1000));
          if (remaining > 0) {
            countdownText = `(${remaining}s left)`;
          }
        }

        return (
          <div key={device.id} className={`alert-banner ${type}`}>
            <div className="alert-actions">
              <Icon size={20} />
              <span>{message} {countdownText}</span>
            </div>
            {(type === 'breach' || type === 'warning') && (
              <button 
                className="alert-ack-btn"
                onClick={() => acknowledgeAlert(device.id)}
              >
                Acknowledge
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AlertBanners;
