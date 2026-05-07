import React from 'react';
import './Automation.css';
import { useAutomationSimulation } from '../../hooks/useAutomationSimulation';
import { 
  Thermometer, 
  Droplets, 
  FlaskConical,
  Play,
  Pause
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const Automation = () => {
  const { targets, state } = useAutomationSimulation();

  return (
    <div className="automation-view">
      <header className="automation-header">
        <div className="automation-header-left">
          <h1>Automation Control</h1>
          <p>Simulated PID control for indoor climate and water balance.</p>
        </div>
        <button 
          className={`toggle-sim-btn ${state.isRunning ? 'running' : 'paused'}`}
          onClick={() => state.setIsRunning(!state.isRunning)}
        >
          {state.isRunning ? (
             <><Pause size={18} /> Pause Simulation</>
          ) : (
             <><Play size={18} /> Resume Simulation</>
          )}
        </button>
      </header>

      <div className="sensor-grid">
        {/* Temperature Card */}
        <div className="sensor-card">
          <div className="card-title">
            <Thermometer size={18} /> Temperature Control
          </div>
          <div className="metrics-row">
            <div className="metric-box">
              <label>Outdoor</label>
              <span>{state.outdoorTemp}<small>°C</small></span>
            </div>
            <div className="metric-box indoor-temp">
              <label>Indoor</label>
              <span>{state.indoorTemp}<small>°C</small></span>
            </div>
            <div className="metric-box">
              <label>AC Power</label>
              <span>{state.acPower}<small>W</small></span>
            </div>
          </div>
          <div className="visual-bar-container">
            <div className="visual-labels">
              <span>Room Target: {targets.targetIndoorTemp}°C</span>
            </div>
            <input 
              type="range" 
              className="custom-slider" 
              min="16" max="32" step="0.5"
              value={targets.targetIndoorTemp}
              onChange={(e) => targets.setTargetIndoorTemp(parseFloat(e.target.value))}
            />
            <div className="visual-labels" style={{ marginTop: '4px' }}>
              <span style={{color: 'var(--text-muted)'}}>Status: {state.indoorTemp > targets.targetIndoorTemp ? 'Cooling' : 'Heating/Idle'} (AC Output: {state.acTarget}°C)</span>
            </div>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="sensor-card">
          <div className="card-title">
            <Droplets size={18} color="#2196F3" /> Humidity & Sprayer
          </div>
          <div className="metrics-row">
            <div className="metric-box humidity-val">
              <label>Humidity</label>
              <span>{state.humidity}<small>%</small></span>
            </div>
            <div className="metric-box">
              <label>Sprayer</label>
              <span>{state.sprayerStatus}</span>
            </div>
          </div>
          <div className="visual-bar-container">
            <div className="visual-labels">
              <span>{targets.targetHumidityMin}% min</span>
              <span>{targets.targetHumidityMax}% max</span>
            </div>
            <div className="visual-bar">
              <div 
                 className="visual-fill" 
                 style={{
                   width: `${state.humidity}%`, 
                   backgroundColor: state.humidity < targets.targetHumidityMin ? '#FF5252' : state.humidity > targets.targetHumidityMax ? '#FF5252' : '#2196F3'
                 }} 
              />
            </div>
          </div>
        </div>

        {/* pH Card */}
        <div className="sensor-card">
          <div className="card-title">
            <FlaskConical size={18} color="#4CAF50" /> Water & pH
          </div>
          <div className="metrics-row">
            <div className={`metric-box ph-val ${state.waterPh < 5.5 || state.waterPh > 6.5 ? 'critical' : ''}`}>
              <label>pH Level { (state.waterPh < 5.5 || state.waterPh > 6.5) && <span style={{color: '#FF5252', fontSize: '10px', marginLeft: '5px', fontWeight: 'bold'}}>(CRITICAL)</span> }</label>
              <span>{state.waterPh}</span>
            </div>
            <div className="metric-box">
              <label>Reservoir</label>
              <span>{state.reservoir}<small>L</small></span>
            </div>
          </div>
          <div className="visual-bar-container">
            <div className="visual-labels">
              <span>Target pH: {targets.targetPh}</span>
            </div>
            <input 
              type="range" 
              className="custom-slider" 
              min="4.0" max="8.0" step="0.1"
              value={targets.targetPh}
              onChange={(e) => targets.setTargetPh(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        {/* Live Chart */}
        <div className="chart-panel">
          <h3>Simulation History</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={state.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="indoorTemp" name="Indoor Temp (°C)" stroke="#3A5A40" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="left" type="monotone" dataKey="outdoorTemp" name="Outdoor Temp (°C)" stroke="#FF9800" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#2196F3" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="left" type="monotone" dataKey="ph" name="pH" stroke="#9C27B0" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Log */}
        <div className="event-log-panel">
          <h3>Event Log</h3>
          <div className="log-list">
            {state.logs.length === 0 ? (
               <div className="log-item"><span className="log-msg" style={{color: 'var(--text-muted)'}}>Waiting for events...</span></div>
            ) : (
               state.logs.map((log, i) => (
                 <div key={i} className="log-item">
                   <span className="log-time">{log.time}</span>
                   <span className="log-msg">{log.msg}</span>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Automation;
