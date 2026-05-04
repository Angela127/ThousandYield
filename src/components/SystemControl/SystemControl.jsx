import React, { useState } from 'react';
import { 
  Lightbulb, 
  Droplets, 
  Wind, 
  ThermometerSnowflake, 
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import './SystemControl.css';

const ControlItem = ({ icon: Icon, label, status, value, onToggle }) => (
  <div className="control-item">
    <div className="control-info">
      <div className={`control-icon ${status ? 'active' : ''}`}>
        <Icon size={20} />
      </div>
      <div className="control-text">
        <span className="control-label">{label}</span>
        <span className="control-status">{status ? 'Active' : 'Inactive'} {value && `• ${value}`}</span>
      </div>
    </div>
    <button className={`toggle-btn ${status ? 'on' : 'off'}`} onClick={onToggle}>
      {status ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
    </button>
  </div>
);

const SystemControl = () => {
  const [controls, setControls] = useState([
    { id: 1, icon: Lightbulb, label: 'LED Lighting', status: true, value: '80% Intensity' },
    { id: 2, icon: Droplets, label: 'Irrigation Pump', status: false, value: 'Next: 2h 15m' },
    { id: 3, icon: Wind, label: 'Ventilation Fans', status: true, value: 'Speed: Medium' },
    { id: 4, icon: ThermometerSnowflake, label: 'Cooling System', status: false, value: 'Idle' },
  ]);

  const toggleControl = (id) => {
    setControls(controls.map(c => c.id === id ? { ...c, status: !c.status } : c));
  };

  return (
    <div className="system-control-card">
      <div className="card-header">
        <h3>System Control</h3>
        <span className="power-usage"><Zap size={14} /> 1.2 kW/h</span>
      </div>
      <div className="controls-list">
        {controls.map(ctrl => (
          <ControlItem 
            key={ctrl.id} 
            {...ctrl} 
            onToggle={() => toggleControl(ctrl.id)} 
          />
        ))}
      </div>
      <div className="ai-insight">
        <div className="ai-icon">✨</div>
        <p>AI suggests increasing airflow by 15% due to rising ambient humidity.</p>
      </div>
    </div>
  );
};

export default SystemControl;
