import React from 'react';
import './FarmSettings.css';

/**
 * Settings Modal for controlling the Virtual Farm environment
 */
export const FarmSettings = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    onSettingsChange(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  return (
    <div className="vf-modal-overlay" onClick={onClose}>
      <div className="vf-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="vf-settings-header">
          <h2>Farm Settings</h2>
          <button className="vf-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="vf-settings-content">
          <div className="vf-setting-group">
            <label>
              <span>Grow Light Intensity</span>
              <span className="vf-setting-value">{Math.round(settings.lightIntensity * 100)}%</span>
            </label>
            <input 
              type="range" 
              name="lightIntensity" 
              min="0" max="1" step="0.05"
              value={settings.lightIntensity} 
              onChange={handleChange} 
            />
          </div>

          <div className="vf-setting-group">
            <label>
              <span>Ventilation Fan Speed</span>
              <span className="vf-setting-value">{settings.fanSpeed.toFixed(1)}x</span>
            </label>
            <input 
              type="range" 
              name="fanSpeed" 
              min="0" max="5" step="0.1"
              value={settings.fanSpeed} 
              onChange={handleChange} 
            />
          </div>

          <div className="vf-setting-group">
            <label>
              <span>Mist Spray Interval (mins)</span>
              <span className="vf-setting-value">{settings.sprayInterval}</span>
            </label>
            <input 
              type="range" 
              name="sprayInterval" 
              min="1" max="30" step="1"
              value={settings.sprayInterval} 
              onChange={handleChange} 
            />
          </div>

          <div className="vf-setting-group">
            <label>
              <span>Target Temperature (°C)</span>
              <span className="vf-setting-value">{settings.temperature}°C</span>
            </label>
            <input 
              type="range" 
              name="temperature" 
              min="15" max="35" step="1"
              value={settings.temperature} 
              onChange={handleChange} 
            />
          </div>

          <div className="vf-setting-group">
            <label>
              <span>Water Pump Cycle (mins)</span>
              <span className="vf-setting-value">{settings.pumpInterval}</span>
            </label>
            <input 
              type="range" 
              name="pumpInterval" 
              min="1" max="60" step="1"
              value={settings.pumpInterval} 
              onChange={handleChange} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
