import React, { useState } from 'react';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { Droplets, Power, ChevronRight, Sprout, Leaf, Flower, Cherry, Layers, X, Calendar, Activity, Info } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Mock data for zone history
const getMockZoneHistory = (id) => [
  { time: '00:00', moisture: 65 },
  { time: '04:00', moisture: 60 },
  { time: '08:00', moisture: 75 },
  { time: '12:00', moisture: 70 },
  { time: '16:00', moisture: 65 },
  { time: '20:00', moisture: 62 },
  { time: 'now', moisture: 72 },
];

const getGrowthStageIcon = (stage) => {
  switch(stage) {
    case 'seedling': return <Sprout size={24} />;
    case 'vegetative': return <Leaf size={24} />;
    case 'flowering': return <Flower size={24} />;
    case 'harvest-ready': return <Cherry size={24} />;
    default: return <Leaf size={24} />;
  }
};

const ZoneMonitor = () => {
  const { zones, triggerManualRun, pump, schedules } = useIrrigationContext();
  const [activeZoneId, setActiveZoneId] = useState(null);

  const handleZoneClick = (id) => {
    setActiveZoneId(id);
  };

  const handleCloseModal = () => {
    setActiveZoneId(null);
  };

  const activeZone = activeZoneId ? zones.find(z => z.id === activeZoneId) : null;
  const zoneSchedules = activeZone ? schedules.filter(s => s.zoneId === activeZone.id) : [];
  const historyData = activeZone ? getMockZoneHistory(activeZone.id) : [];

  return (
    <div className="master-zone-container">
      <div className="master-header">
        <div className="group-icon-wrapper" style={{background: '#dbeafe', color: '#1d4ed8'}}>
          <Layers size={24} />
        </div>
        <div className="header-text">
          <h2>Irrigation Subsystems: Grow Zones</h2>
          <p>Select a zone below to view detailed metrics and controls.</p>
        </div>
      </div>

      <div className="zone-grid-wrapper">
        <div className="zone-grid">
          {zones.map(zone => (
            <div 
              key={zone.id} 
              className={`group-card ${zone.status} ${zone.pumpActive ? 'active' : ''}`}
              onClick={() => handleZoneClick(zone.id)}
            >
              <div className="group-card-header">
                <div className="group-icon-wrapper water">
                  <Droplets size={24} />
                </div>
                <div className="group-info">
                  <h3>{zone.name}</h3>
                  <p>{zone.crop}</p>
                </div>
                <ChevronRight className="drill-down-arrow" size={20} />
              </div>
              
              <div className="group-card-body">
                <div className="group-metric">
                  <span className="metric-label">Soil Moisture</span>
                  <span className="metric-value">{zone.moisture}%</span>
                </div>
                <div className="group-status-pill">
                  <div className={`status-dot ${zone.pumpActive ? 'on' : (zone.status === 'warning' ? 'warning' : 'ok')}`}></div>
                  <span>{zone.pumpActive ? 'Irrigating' : 'Idle'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ZONE DETAIL MODAL */}
      {activeZone && (
        <div className="zone-modal-overlay" onClick={handleCloseModal}>
          <div className="zone-modal-content improved" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header-new">
              <div className="header-main">
                <div className={`hero-icon-wrapper ${activeZone.growthStage}`}>
                  {getGrowthStageIcon(activeZone.growthStage)}
                </div>
                <div className="header-info">
                  <div className="breadcrumb">Zones / {activeZone.id.replace('_', ' ')}</div>
                  <h2>{activeZone.name} — {activeZone.crop}</h2>
                </div>
              </div>
              <div className="header-actions">
                <div className={`status-pill ${activeZone.status}`}>
                  <span className={`status-dot ${activeZone.status}`}></span>
                  System {activeZone.status === 'ok' ? 'Optimal' : 'Warning'}
                </div>
                <button className="modal-close-btn-round" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body-scroll">
              {/* Hero Stats Row */}
              <div className="hero-stats-row">
                <div className="hero-stat-card">
                  <div className="stat-icon moisture"><Droplets size={20}/></div>
                  <div className="stat-content">
                    <span className="label">Current Moisture</span>
                    <span className="value">{activeZone.moisture}%</span>
                    <div className="mini-progress"><div className="fill" style={{width: `${activeZone.moisture}%`}}></div></div>
                  </div>
                </div>
                <div className="hero-stat-card">
                  <div className="stat-icon water"><Activity size={20}/></div>
                  <div className="stat-content">
                    <span className="label">Water Used (Today)</span>
                    <span className="value">{activeZone.usageStats.todayL.toFixed(1)} L</span>
                    <span className="trend positive">+2.4% vs avg</span>
                  </div>
                </div>
                <div className="hero-stat-card">
                  <div className="stat-icon stage"><Sprout size={20}/></div>
                  <div className="stat-content">
                    <span className="label">Growth Stage</span>
                    <span className="value" style={{textTransform: 'capitalize'}}>{activeZone.growthStage.replace('-', ' ')}</span>
                    <span className="subtext">Day 24 of cycle</span>
                  </div>
                </div>
              </div>

              {/* Main Graph Section */}
              <div className="modal-graph-section">
                <div className="section-header">
                  <h3>Moisture Level History (24h)</h3>
                  <div className="chart-legend">
                    <span className="dot safe"></span> Optimal
                    <span className="dot warning"></span> Below Threshold
                  </div>
                </div>
                <div className="chart-container" style={{height: '240px', width: '100%', marginTop: '1rem'}}>
                  <ResponsiveContainer>
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                        formatter={(val) => [`${val}%`, 'Moisture']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="moisture" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        fill="url(#moistureGradient)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Details Grid */}
              <div className="modal-details-grid">
                {/* Left: Automation & Schedules */}
                <div className="detail-panel">
                  <div className="panel-header">
                    <Calendar size={18}/>
                    <h4>Automation & Schedule</h4>
                  </div>
                  <div className="schedule-mini-list">
                    {zoneSchedules.map(sch => (
                      <div key={sch.id} className="sch-item">
                        <span className="time">{sch.time}</span>
                        <span className="duration">{sch.durationMinutes} min run</span>
                        <span className="next">Next: in 4h</span>
                      </div>
                    ))}
                    {zoneSchedules.length === 0 && <p className="empty-text">No active schedules.</p>}
                  </div>
                  <div className="threshold-info">
                    <Info size={14}/>
                    <span>Auto-irrigation triggers at <strong>{activeZone.minMoisture}%</strong> moisture.</span>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="detail-panel controls">
                  <div className="panel-header">
                    <Power size={18}/>
                    <h4>Manual System Override</h4>
                  </div>
                  <p className="panel-desc">Manually trigger the pump for this zone. This will bypass the current schedule for 5 minutes.</p>
                  <div className="control-actions">
                    <button 
                      className={`manual-override-btn-large ${activeZone.pumpActive ? 'active' : ''}`}
                      onClick={() => triggerManualRun(activeZone.id, 5)}
                      disabled={pump.status === 'lockout'}
                    >
                      <Power size={20} />
                      {activeZone.pumpActive ? 'Stop Irrigation' : 'Start Manual Irrigation'}
                    </button>
                    <div className={`pump-status-badge ${activeZone.pumpActive ? 'active' : ''}`}>
                      {activeZone.pumpActive ? 'Pump Running' : 'Pump Standby'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneMonitor;
