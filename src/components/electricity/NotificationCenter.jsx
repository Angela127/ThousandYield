import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Info, Zap } from 'lucide-react';
import { useElectricityContext } from '../../context/ElectricityContext';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = () => {
  const { deviceRegistry, budgetStatus, acknowledgeAlert } = useElectricityContext();
  const [isOpen, setIsOpen] = useState(false);
  const notifRef = useRef(null);

  // Collect all active alerts
  const alerts = [];

  // Budget alerts
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

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="notification-center" ref={notifRef} style={{ position: 'absolute', top: 0, right: 0 }}>
      <button 
        className="bell-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'white',
          border: '1px solid rgba(0,0,0,0.05)',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#555',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      >
        <Bell size={20} />
        {alerts.length > 0 && (
          <span className="badge" style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#f44336',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 700,
            minWidth: '16px',
            height: '16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white'
          }}>
            {alerts.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="notif-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              width: '320px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.08)',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            <div className="notif-panel-header" style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Notifications</h4>
              <span className="notif-count" style={{
                fontSize: '0.75rem',
                color: '#888',
                background: '#f5f5f5',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>{alerts.length} alerts</span>
            </div>
            <div className="notif-list-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {alerts.length === 0 ? (
                <div className="notif-empty" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#aaa' }}>
                  <p>No active notifications</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="notif-hub-item" style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid #f9f9f9'
                  }}>
                    <div className="notif-hub-icon" style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: alert.type === 'danger' ? '#ffebee' : '#fff3e0',
                      color: alert.type === 'danger' ? '#f44336' : '#ff9800'
                    }}>
                      {alert.type === 'danger' ? <AlertTriangle size={16} /> : <Info size={16} />}
                    </div>
                    <div className="notif-hub-content" style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#333', lineHeight: '1.4' }}>{alert.message}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#999' }}>{alert.time}</span>
                        {alert.canAcknowledge && (
                          <button 
                            onClick={() => acknowledgeAlert(alert.deviceId)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              background: '#3A5A40',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
