import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { Droplets, Power, ChevronRight, Sprout, Leaf, Flower, Cherry, Layers, X, Calendar, Activity, Info } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatCard from '../StatCard/StatCard';

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
  switch (stage) {
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
        <div className="group-icon-wrapper" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
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
              onClick={() => handleZoneClick(zone.id)}
              style={{ cursor: 'pointer' }}
            >
              <StatCard
                icon={Droplets}
                label={zone.name}
                value={zone.moisture}
                unit="%"
                status={zone.pumpActive ? 'active' : (zone.status === 'warning' ? 'warning' : 'optimal')}
                subtext={`${zone.crop} • ${zone.pumpActive ? 'Irrigating' : 'Idle'}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ZONE DETAIL MODAL */}
      {activeZone && createPortal(
        <div className="zone-modal-overlay" onClick={handleCloseModal}>
          <div className="zone-modal-content improved" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header-new">
              <div className="header-main-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className={`hero-icon-wrapper ${activeZone.growthStage}`}>
                  {getGrowthStageIcon(activeZone.growthStage)}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{activeZone.name} — {activeZone.crop}</h2>
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
                <StatCard
                  icon={Droplets}
                  label="Current Moisture"
                  value={activeZone.moisture}
                  unit="%"
                  status={activeZone.status === 'ok' ? 'optimal' : 'warning'}
                  subtext={activeZone.status === 'ok' ? "Optimal level for growth" : "Below threshold!"}
                />
                <StatCard
                  icon={Activity}
                  label="Water Used (Today)"
                  value={activeZone.usageStats.todayL.toFixed(1)}
                  unit="L"
                  status="optimal"
                  subtext="+2.4% vs avg"
                />
                <StatCard
                  icon={Sprout}
                  label="Growth Stage"
                  value={activeZone.growthStage.replace('-', ' ')}
                  unit=""
                  status="optimal"
                  subtext="Day 24 of cycle"
                />
              </div>

              {/* Main Graph Section */}
              <div className="modal-graph-section">
                <div className="section-header">
                  <h3>Moisture Level History (24h)</h3>
                  <div className="chart-legend" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="dot safe"></span> Optimal
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="dot warning"></span> Below Threshold
                    </div>
                  </div>
                </div>
                <div className="chart-container" style={{ height: '240px', width: '100%', marginTop: '1rem' }}>
                  <ResponsiveContainer>
                    <AreaChart data={historyData}>
                      <defs>
                        <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(val) => [`${val}%`, 'Moisture']}
                      />
                      <Area
                        type="monotone"
                        dataKey="moisture"
                        stroke="#2196F3"
                        strokeWidth={3}
                        fill="url(#moistureGradient)"
                        filter="url(#glow)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Details Grid */}
              <div className="modal-details-grid">
                {/* Left: Automation & Schedules */}
                <div className="detail-panel">
                  <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start' }}>
                    <Calendar size={18} color="#10b981" />
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
                    <Info size={14} />
                    <span>Auto-irrigation triggers at <strong>{activeZone.minMoisture}%</strong> moisture.</span>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="detail-panel controls">
                  <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start' }}>
                    <Power size={18} color="#10b981" />
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default ZoneMonitor;
