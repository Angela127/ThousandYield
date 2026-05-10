import React, { useState } from 'react';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { useElectricityContext } from '../../context/ElectricityContext';
import { useClimateContext } from '../../context/ClimateContext';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Info, Zap, Droplets, Clock, Activity, Check } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const { alerts: irrigationAlerts, acknowledgeAlert: ackIrrigation } = useIrrigationContext();
  const { deviceRegistry, budgetStatus, acknowledgeAlert: ackElectricity } = useElectricityContext();
  const { notifications: climateNotifications } = useClimateContext();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('All');

  // Combine and normalize notifications
  const allNotifications = [];

  // 1. Irrigation
  irrigationAlerts.forEach(alert => {
    allNotifications.push({
      id: `irrigation-${alert.id}`,
      source: 'Irrigation',
      type: alert.severity === 'danger' ? 'danger' : 'warning',
      icon: Droplets,
      title: 'Irrigation System',
      message: alert.message,
      time: 'Active',
      canAcknowledge: true,
      onAcknowledge: (e) => {
        e.stopPropagation();
        ackIrrigation(alert.id);
      }
    });
  });

  // 2. Electricity
  if (budgetStatus === 'critical') {
    allNotifications.push({
      id: 'electricity-budget-critical',
      source: 'Electricity',
      type: 'danger',
      icon: Zap,
      title: 'Power Budget Exceeded',
      message: 'Facility power usage is above 90% of budget. Emergency cuts active.',
      time: 'Just now',
      canAcknowledge: false
    });
  } else if (budgetStatus === 'warning') {
    allNotifications.push({
      id: 'electricity-budget-warning',
      source: 'Electricity',
      type: 'warning',
      icon: Zap,
      title: 'High Power Usage',
      message: 'Facility power usage has reached 80% of budget.',
      time: 'Just now',
      canAcknowledge: false
    });
  }

  Object.keys(deviceRegistry).forEach(id => {
    const device = deviceRegistry[id];
    if (device.alert) {
      allNotifications.push({
        id: `electricity-device-${id}`,
        source: 'Electricity',
        type: device.alert.type === 'breach' ? 'danger' : (device.alert.type === 'warning' ? 'warning' : 'info'),
        icon: Zap,
        title: device.name,
        message: device.alert.message,
        time: device.countdownStartedAt ? 'Countdown Active' : 'Active',
        canAcknowledge: device.alert.type !== 'info',
        onAcknowledge: (e) => {
          e.stopPropagation();
          ackElectricity(id);
        }
      });
    }
  });

  // 3. Climate
  climateNotifications.forEach(notif => {
    allNotifications.push({
      id: `climate-${notif.id}`,
      source: 'Environment',
      type: notif.type === 'CRITICAL' ? 'danger' : 'warning',
      icon: Activity,
      title: 'Climate Intelligence',
      message: notif.message,
      time: notif.time,
      canAcknowledge: false
    });
  });

  // Sort by severity (danger first, then warning, then info)
  const severityOrder = { danger: 0, warning: 1, info: 2 };
  allNotifications.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

  // Apply filter
  const filteredNotifications = allNotifications.filter(notif => 
    filter === 'All' || notif.source === filter
  );

  const handleNavigation = (source) => {
    if (source === 'Environment') navigate('/environment');
    if (source === 'Electricity') navigate('/electricity');
    if (source === 'Irrigation') navigate('/irrigation');
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <p>Unified alerts from all farm systems. Click a notification or filter to visit the tab.</p>
      </div>

      <div className="notifications-filters">
        <button 
          className={`filter-btn ${filter === 'All' ? 'active' : ''}`}
          onClick={() => setFilter('All')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === 'Environment' ? 'active' : ''}`}
          onClick={() => setFilter('Environment')}
        >
          Environment
        </button>
        <button 
          className={`filter-btn ${filter === 'Electricity' ? 'active' : ''}`}
          onClick={() => setFilter('Electricity')}
        >
          Electricity
        </button>
        <button 
          className={`filter-btn ${filter === 'Irrigation' ? 'active' : ''}`}
          onClick={() => setFilter('Irrigation')}
        >
          Irrigation
        </button>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-notifications">
            <Bell size={48} opacity={0.3} />
            <p>No active notifications for this filter.</p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const Icon = notif.icon;
            return (
              <div 
                key={notif.id} 
                className={`notification-card ${notif.type} clickable`}
                onClick={() => handleNavigation(notif.source)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notif-icon-wrapper">
                  <Icon size={20} />
                </div>
                <div className="notif-content">
                  <div className="notif-meta">
                    <span className="notif-source">{notif.source}</span>
                    <span className="notif-time">
                      <Clock size={12} />
                      {notif.time}
                    </span>
                  </div>
                  <h3 className="notif-title">{notif.title}</h3>
                  <p className="notif-message">{notif.message}</p>
                  {notif.canAcknowledge && (
                    <button className="notif-ack-btn" onClick={notif.onAcknowledge}>
                      <Check size={14} />
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
