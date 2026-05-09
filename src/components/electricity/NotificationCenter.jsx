import React, { useState } from 'react';
import { Bell, X, AlertTriangle, Info, Zap, Trash2 } from 'lucide-react';
import { useElectricityContext } from '../../context/ElectricityContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const { deviceRegistry, budgetStatus, acknowledgeAlert } = useElectricityContext();
  const [isOpen, setIsOpen] = useState(false);

  // Collect all active alerts
  const alerts = [];

  // Budget alerts (cannot be acknowledged, they are system states)
  if (budgetStatus === 'critical') {
    alerts.push({
      id: 'budget-critical',
      type: 'danger',
      title: 'CRITICAL: Power Budget Exceeded',
      message: 'Facility power usage is above 90% of budget. Emergency cuts active.',
      time: 'Just now',
      canAcknowledge: false
    });
  } else if (budgetStatus === 'warning') {
    alerts.push({
      id: 'budget-warning',
      type: 'warning',
      title: 'Warning: High Power Usage',
      message: 'Facility power usage has reached 80% of budget.',
      time: 'Just now',
      canAcknowledge: false
    });
  }

  // Device alerts
  Object.keys(deviceRegistry).forEach(id => {
    const device = deviceRegistry[id];
    if (device.alert) {
      alerts.push({
        id: `device-${id}`,
        deviceId: id,
        type: device.alert.type === 'breach' ? 'danger' : (device.alert.type === 'warning' ? 'warning' : 'info'),
        title: device.name,
        message: device.alert.message,
        time: device.countdownStartedAt ? 'Countdown Active' : 'Active',
        canAcknowledge: device.alert.type !== 'info'
      });
    }
  });

  return (
    <div className="notification-center">
      <button className="bell-btn" onClick={() => setIsOpen(true)}>
        <Bell size={22} />
        {alerts.length > 0 && <span className="badge">{alerts.length}</span>}
      </button>

      {isOpen && (
        <div className="notification-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="notification-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <Bell size={20} />
                <h2>System Notifications</h2>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {alerts.length === 0 ? (
                <div className="empty-state">
                  <Zap size={48} className="empty-icon" />
                  <p>All systems normal. No active notifications.</p>
                </div>
              ) : (
                <div className="notification-list">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`notification-item ${alert.type}`}>
                      <div className="item-icon">
                        {alert.type === 'danger' ? <AlertTriangle size={20} /> : <Info size={20} />}
                      </div>
                      <div className="item-content">
                        <div className="item-header">
                          <span className="item-title">{alert.title}</span>
                          <span className="item-time">{alert.time}</span>
                        </div>
                        <p className="item-message">{alert.message}</p>
                        {alert.canAcknowledge && (
                          <button 
                            className="ack-inline-btn"
                            onClick={() => acknowledgeAlert(alert.deviceId)}
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <p>{alerts.length} Active System Alerts</p>
              {alerts.length > 0 && (
                 <button className="clear-all-btn" onClick={() => setIsOpen(false)}>
                   <X size={14} /> Close
                 </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
