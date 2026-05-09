import React, { useState } from 'react';
import './Settings.css';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Sprout, 
  Thermometer, 
  Droplets, 
  FlaskConical,
  Save,
  Zap,
  Activity,
  AlertTriangle
} from 'lucide-react';

const ThresholdItem = ({ label, icon: Icon, min, max, unit, onChange }) => (
  <div className="threshold-item">
    <div className="threshold-label">
      <Icon size={18} />
      <span>{label}</span>
    </div>
    <div className="threshold-inputs">
      <div className="input-group">
        <label>Min</label>
        <input type="number" defaultValue={min} />
      </div>
      <div className="input-divider">-</div>
      <div className="input-group">
        <label>Max</label>
        <input type="number" defaultValue={max} />
      </div>
      <span className="unit">{unit}</span>
    </div>
  </div>
);

const Settings = () => {
  const [activeSection, setActiveSection] = useState('thresholds');
  const [anomalyMode, setAnomalyMode] = useState(localStorage.getItem('simulation_anomaly') || 'none');

  const saveAnomaly = (type) => {
    setAnomalyMode(type);
    localStorage.setItem('simulation_anomaly', type);
  };

  const plantProfiles = [
    { name: 'Lettuce (Standard)', selected: true },
    { name: 'Spinach (Growth)', selected: false },
    { name: 'Basil (Aromatic)', selected: false },
    { name: 'Kale (Winter)', selected: false },
  ];

  return (
    <div className="settings-view">
      <header className="view-header">
        <h1>System Settings</h1>
        <p>Configure automation thresholds, plant profiles, and system preferences.</p>
      </header>

      <div className="settings-container">
        <aside className="settings-nav">
          <button 
            className={`settings-nav-item ${activeSection === 'thresholds' ? 'active' : ''}`}
            onClick={() => setActiveSection('thresholds')}
          >
            <Shield size={18} /> Thresholds
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'simulation' ? 'active' : ''}`}
            onClick={() => setActiveSection('simulation')}
          >
            <Activity size={18} /> Simulation
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'profiles' ? 'active' : ''}`}
            onClick={() => setActiveSection('profiles')}
          >
            <Sprout size={18} /> Plant Profiles
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            <Bell size={18} /> Notifications
          </button>
          <button 
            className={`settings-nav-item ${activeSection === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSection('account')}
          >
            <User size={18} /> Account
          </button>
        </aside>

        <main className="settings-content">
          {activeSection === 'thresholds' && (
            <div className="settings-section">
              <h3>Automation Thresholds</h3>
              <p>Set the range for automatic system triggers (fans, pumps, heaters).</p>
              
              <div className="threshold-list">
                <ThresholdItem label="Temperature" icon={Thermometer} min={20} max={26} unit="°C" />
                <ThresholdItem label="Humidity" icon={Droplets} min={55} max={75} unit="%" />
                <ThresholdItem label="Soil Moisture" icon={Sprout} min={35} max={50} unit="%" />
                <ThresholdItem label="Water pH" icon={FlaskConical} min={5.8} max={6.5} unit="pH" />
              </div>

              <div className="settings-actions">
                <button className="save-btn"><Save size={18} /> Save Changes</button>
              </div>
            </div>
          )}

          {activeSection === 'simulation' && (
            <div className="settings-section">
              <h3>Anomaly Simulation</h3>
              <p>Simulate sensor failures and environmental anomalies to test dashboard responses.</p>
              
              <div className="simulation-grid">
                {[
                  { id: 'none', name: 'Normal Operation', icon: Activity, desc: 'Live data stream with no active anomalies.', color: '#4caf50' },
                  { id: 'heatwave', name: 'Heatwave Alert', icon: Thermometer, desc: 'Simulate high temperature and low humidity (Critical/Watch).', color: '#ff9800' },
                  { id: 'ph_failure', name: 'pH Critical Failure', icon: FlaskConical, desc: 'Simulate pH levels rising beyond safe bounds (Critical).', color: '#f44336' },
                  { id: 'sensor_malfunction', name: 'Sensor Malfunction', icon: AlertTriangle, desc: 'Simulate flat-line data or erratic readings (Watch).', color: '#9c27b0' },
                ].map((scenario) => (
                  <div 
                    key={scenario.id} 
                    className={`sim-card ${anomalyMode === scenario.id ? 'active' : ''}`}
                    onClick={() => saveAnomaly(scenario.id)}
                  >
                    <div className="sim-icon" style={{ backgroundColor: scenario.color + '15', color: scenario.color }}>
                      <scenario.icon size={24} />
                    </div>
                    <div className="sim-info">
                      <h4>{scenario.name}</h4>
                      <p>{scenario.desc}</p>
                    </div>
                    {anomalyMode === scenario.id && <div className="active-dot"></div>}
                  </div>
                ))}
              </div>
              
              {anomalyMode !== 'none' && (
                <div className="sim-status-banner">
                  <Zap size={16} />
                  <span>Simulation Active: {anomalyMode.replace('_', ' ')} mode is currently overriding live data.</span>
                </div>
              )}
            </div>
          )}

          {activeSection === 'profiles' && (
            <div className="settings-section">
              <h3>Plant Profiles</h3>
              <p>Select a pre-configured growth profile for your current crop.</p>
              
              <div className="profiles-grid">
                {plantProfiles.map((profile, i) => (
                  <div key={i} className={`profile-card ${profile.selected ? 'selected' : ''}`}>
                    <div className="profile-info">
                      <Sprout size={24} />
                      <span>{profile.name}</span>
                    </div>
                    {profile.selected ? (
                      <span className="active-tag">Active</span>
                    ) : (
                      <button className="select-btn">Select</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <div className="notif-list">
                {[
                  { label: 'Critical Alerts', desc: 'pH, Temperature, Water Level failures', active: true },
                  { label: 'System Reports', desc: 'Daily efficiency and usage summaries', active: true },
                  { label: 'Growth Milestones', desc: 'Stage changes and harvest reminders', active: false },
                  { label: 'Device Updates', desc: 'Firmware and automation log triggers', active: false },
                ].map((item, i) => (
                  <div key={i} className="notif-item">
                    <div className="notif-info">
                      <span className="notif-label">{item.label}</span>
                      <span className="notif-desc">{item.desc}</span>
                    </div>
                    <div className={`switch ${item.active ? 'on' : ''}`}></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
