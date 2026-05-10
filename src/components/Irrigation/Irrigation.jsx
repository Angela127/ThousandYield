import React, { useState, useRef, useEffect } from 'react';
import IrrigationAlerts from './IrrigationAlerts';
import SummaryMetrics from './SummaryMetrics';
import ZoneMonitor from './ZoneMonitor';
import UsageGraph from './UsageGraph';
import ScheduleBuilder from './ScheduleBuilder';
import OptimisationPanel from './OptimisationPanel';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { Bell, AlertTriangle } from 'lucide-react';
import './IrrigationTab.css';

const IrrigationTabContent = () => {
  const { alerts, acknowledgeAlert } = useIrrigationContext();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifPanel(false);
      }
    };
    if (showNotifPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifPanel]);

  return (
    <div className="irrigation-view-container">
      <div className="irrigation-header" style={{ position: 'relative' }}>
        <div className="header-top-bar">
          <div className="header-text">
            <h1>Irrigation Command Center</h1>
            <p>Live moisture monitoring, automated pH dosing, and zone scheduling.</p>
          </div>
          
          <div className="notification-hub" ref={notifRef} style={{ position: 'absolute', top: '0', right: '0' }}>
            <button 
              className={`header-bell-btn ${alerts.length > 0 ? 'has-unread' : ''}`}
              onClick={() => setShowNotifPanel(!showNotifPanel)}
            >
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="unread-badge" style={{
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

            {showNotifPanel && (
              <div className="notif-panel" style={{
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
              }}>
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
                      <p>No active alerts</p>
                    </div>
                  ) : (
                    alerts.map(n => (
                      <div key={n.id} className="notif-hub-item" style={{
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
                          background: n.severity === 'danger' ? '#ffebee' : '#fff3e0',
                          color: n.severity === 'danger' ? '#f44336' : '#ff9800'
                        }}>
                          <AlertTriangle size={16} />
                        </div>
                        <div className="notif-hub-content" style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#333', lineHeight: '1.4' }}>{n.message}</p>
                          <button 
                            onClick={() => acknowledgeAlert(n.id)}
                            style={{
                              marginTop: '0.5rem',
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
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <IrrigationAlerts />
      <SummaryMetrics />
      <ZoneMonitor />
      
      <div className="irrigation-mixed-grid">
        <UsageGraph />
        <ScheduleBuilder />
      </div>

      <OptimisationPanel />
    </div>
  );
};

const Irrigation = () => {
  return <IrrigationTabContent />;
};

export default Irrigation;
