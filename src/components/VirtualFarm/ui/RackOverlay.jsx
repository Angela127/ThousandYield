import React, { useEffect, useState, useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import historicalData from '../../../data/historical_24h.json';
import {
  Droplets, Zap, Sun, FlaskConical, ChevronLeft, ChevronRight,
  ShieldCheck, AlertTriangle, Camera, RotateCcw
} from 'lucide-react';
import './RackOverlay.css';

// ── Constants ──
const CROP_EMOJI = { Lettuce: '🥬', Spinach: '🍃', Kale: '🥗', Basil: '🌿', Arugula: '🌱' };
const CROP_IMAGES = {
  Lettuce: '/plants/lettuce.png',
  Spinach: '/plants/spinach.png',
  Kale: '/plants/kale.png',
  Basil: '/plants/basil.png',
  Arugula: '/plants/arugula.png',
};
const getHealthColor = (s) => {
  if (!s) return '#666';
  if (s >= 95) return '#66bb6a';
  if (s >= 85) return '#ffa726';
  return '#ef5350';
};
const getHealthClass = (s) => {
  if (s >= 95) return 'excellent';
  if (s >= 85) return 'good';
  return 'poor';
};

// Generate realistic "last seen" timestamps within the last 24h
const generateLastSeen = (plantIndex) => {
  const now = new Date();
  // Camera visits plants sequentially, so later plants were seen more recently
  const minutesAgo = Math.floor(Math.random() * 1440); // random within 24h
  const seen = new Date(now.getTime() - minutesAgo * 60000);
  return seen;
};

const formatLastSeen = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString();
};

// ── Tower3D (reused from RackDetail) ──
const buildPlantId = (rackId, i) => {
  const rackNum = rackId.replace('rack_', '');
  return `plant${rackNum}${String(i).padStart(2, '0')}`;
};

const buildSlots = (rackId, plants) => {
  const slots = [];
  for (let i = 1; i <= 40; i++) {
    const id = buildPlantId(rackId, i);
    const data = plants?.find(p => p.plant_id === id) || null;
    slots.push({ slotIndex: i, plant_id: id, data });
  }
  return slots;
};

const Tower3D = ({ rack, rotation, onBowlClick }) => {
  const slots = buildSlots(rack.rack_id, rack.plants);
  const emoji = CROP_EMOJI[rack.crop_type] || '🌱';
  const LEVELS = 10;
  const BOWLS_PER_LEVEL = 4;

  return (
    <div className="tower-3d-rotator" style={{ transform: `rotateY(${rotation}deg)` }}>
      <div className="tower-column white" />
      <div className="tower-base-plate" />

      {Array.from({ length: LEVELS }, (_, lvlIdx) => {
        const lvl = lvlIdx + 1;
        const yPos = 85 - lvlIdx * 7.5;
        return (
          <React.Fragment key={`lvl-${lvl}`}>
            <div className="tower-level-tag" style={{ bottom: `${yPos}%` }}>L{lvl}</div>
            {Array.from({ length: BOWLS_PER_LEVEL }, (_, bowlIdx) => {
              const slotNum = lvlIdx * BOWLS_PER_LEVEL + bowlIdx + 1;
              const slot = slots[slotNum - 1];
              const angle = bowlIdx * 90;
              const hasPlant = !!slot.data;

              return (
                <div key={slot.plant_id} className="tower-bowl-anchor"
                  style={{
                    bottom: `${yPos}%`,
                    transform: `rotateY(${angle}deg) translateZ(56px)`
                  }}>
                  <div
                    className={`tower-bowl ${hasPlant ? 'has-plant' : 'empty'} clickable`}
                    onClick={hasPlant ? () => onBowlClick(slot.data) : undefined}
                    title={hasPlant ? `${slot.plant_id} — L${lvl} — Health: ${slot.data.health_score?.toFixed(1)}%` : `${slot.plant_id} — L${lvl}`}
                  >
                    <div className="bowl-cup" />
                    {hasPlant && (
                      <div className="bowl-plant">
                        <span className="bowl-emoji">{emoji}</span>
                        <div className="bowl-health-dot" style={{ background: getHealthColor(slot.data.health_score) }} />
                      </div>
                    )}
                    <span className="bowl-label">{String(slotNum).padStart(2, '0')}</span>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Chart Configs ──
const chartConfigs = {
  ph: { label: 'pH', color: '#66bb6a', gId: 'roGPh', domain: [4, 8], unit: '' },
  ec: { label: 'EC', color: '#ffa726', gId: 'roGEc', domain: [0, 3], unit: ' mS/cm' },
  water: { label: 'Water', color: '#42a5f5', gId: 'roGW', domain: [0, 100], unit: '%' },
  light: { label: 'Light', color: '#ffca28', gId: 'roGL', domain: [0, 'auto'], unit: ' lux' },
};

// ============ MAIN COMPONENT ============
const RackOverlay = ({ rackId, onClose }) => {
  const [allDocs, setAllDocs] = useState(historicalData);
  const [leftView, setLeftView] = useState('rack'); // 'rack' | 'photos'
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [chartMetric, setChartMetric] = useState('ph');
  const [rotation, setRotation] = useState(-30);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [rotStart, setRotStart] = useState(0);

  // Firestore subscription
  useEffect(() => {
    const q = query(collection(db, "telemetry"), orderBy("room_data.timestamp", "asc"), limit(288));
    const unsub = onSnapshot(q, (snap) => {
      const docs = [];
      snap.forEach(d => docs.push(d.data()));
      if (docs.length > 0) setAllDocs(docs);
      else setAllDocs(historicalData);
    }, () => {
      setAllDocs(historicalData);
    });
    return () => unsub();
  }, []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const latestDoc = allDocs.length > 0 ? allDocs[allDocs.length - 1] : null;
  const racks = latestDoc?.room_data?.racks || [];
  const currentRack = useMemo(() => racks.find(r => r.rack_id === rackId), [rackId, racks]);

  const rackHistoryData = useMemo(() => {
    if (!rackId || !allDocs.length) return [];
    return allDocs.map(doc => {
      const rack = doc.room_data.racks?.find(r => r.rack_id === rackId);
      if (!rack) return null;
      const ts = new Date(doc.room_data.timestamp);
      return {
        time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ph: rack.rack_sensors?.ph,
        ec: rack.rack_sensors?.ec_mscmn,
        water: rack.rack_sensors?.water_level_pct,
        light: rack.rack_sensors?.light_intensity_lux
      };
    }).filter(Boolean);
  }, [rackId, allDocs]);

  // Generate "last seen" timestamps for each plant (stable via useMemo)
  const plantLastSeen = useMemo(() => {
    if (!currentRack?.plants) return new Map();
    const map = new Map();
    currentRack.plants.forEach((p, i) => {
      map.set(p.plant_id, generateLastSeen(i));
    });
    return map;
  }, [currentRack?.rack_id]);

  // Drag handlers
  const onMouseDown = (e) => { setIsDragging(true); setDragStart(e.clientX); setRotStart(rotation); };
  const onMouseMove = (e) => { if (!isDragging) return; setRotation(rotStart + (e.clientX - dragStart) * 0.5); };
  const onMouseUp = () => setIsDragging(false);
  const spinLeft = () => setRotation(r => r + 45);
  const spinRight = () => setRotation(r => r - 45);

  if (!currentRack) return null;

  const sensors = currentRack.rack_sensors || {};
  const controllers = currentRack.rack_controllers || {};
  const plants = currentRack.plants || [];
  const avgHealth = plants.length > 0
    ? plants.reduce((s, p) => s + (p.health_score || 0), 0) / plants.length
    : 0;
  const emoji = CROP_EMOJI[currentRack.crop_type] || '🌱';
  const cropImage = CROP_IMAGES[currentRack.crop_type] || CROP_IMAGES.Lettuce;
  const cfg = chartConfigs[chartMetric];

  return (
    <div className="rack-overlay-backdrop" onClick={onClose}>
      <div className="rack-overlay-container" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="ro-header">
          <div className="ro-header-left">
            <div className="ro-header-icon">{emoji}</div>
            <div className="ro-header-title">
              <h2>{rackId.replace('rack_', 'Rack ')}</h2>
              <span className="ro-header-sub">{currentRack.crop_type} · Vertical Lab 01</span>
            </div>
            <div className="ro-header-stats">
              <div className="ro-stat-chip">
                <span className="label">Plants</span>
                <span className="value">{plants.length}/40</span>
              </div>
              <div className="ro-stat-chip">
                <span className="label">Avg Health</span>
                <span className="value">{avgHealth.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <button className="ro-close-btn" onClick={onClose} title="Close (ESC)">✕</button>
        </div>

        {/* ── Body ── */}
        <div className="ro-body">

          {/* ── LEFT PANEL ── */}
          <div className="ro-left-panel">
            <div className="ro-toggle-bar">
              <button
                className={`ro-toggle-btn ${leftView === 'rack' ? 'active' : ''}`}
                onClick={() => setLeftView('rack')}
              >
                <span className="ro-toggle-icon">🔄</span>
                Rack View
              </button>
              <button
                className={`ro-toggle-btn ${leftView === 'photos' ? 'active' : ''}`}
                onClick={() => setLeftView('photos')}
              >
                <span className="ro-toggle-icon">📷</span>
                Plant Photos
              </button>
            </div>

            {leftView === 'rack' ? (
              <div className="ro-rack-spinner">
                <div className="ro-spin-controls">
                  <button className="ro-spin-btn" onClick={spinLeft}><ChevronLeft size={16} /></button>
                  <span className="ro-spin-hint">Drag to spin · Click a plant</span>
                  <button className="ro-spin-btn" onClick={spinRight}><ChevronRight size={16} /></button>
                </div>
                <div className="ro-tower-scene"
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                >
                  <Tower3D rack={currentRack} rotation={rotation} onBowlClick={(p) => setSelectedPlant(p)} />
                </div>
              </div>
            ) : (
              <div className="ro-plant-photos">
                <div className="ro-photos-header">
                  <span className="ro-photos-title">
                    <Camera size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
                    Camera Snapshots
                  </span>
                  <span className="ro-photos-count">{plants.length} plants captured</span>
                </div>
                <div className="ro-photo-grid">
                  {plants.map((plant) => {
                    const lastSeen = plantLastSeen.get(plant.plant_id);
                    return (
                      <div
                        key={plant.plant_id}
                        className={`ro-photo-card ${selectedPlant?.plant_id === plant.plant_id ? 'selected' : ''}`}
                        onClick={() => setSelectedPlant(plant)}
                      >
                        <img
                          src={cropImage}
                          alt={plant.plant_id}
                          className="ro-photo-img"
                          loading="lazy"
                        />
                        <div className="ro-photo-info">
                          <span className="ro-photo-id">
                            <span className="ro-photo-health-dot" style={{ background: getHealthColor(plant.health_score) }} />
                            {plant.plant_id}
                          </span>
                          <span className="ro-photo-lastseen">
                            <span className="cam-icon">📸</span>
                            {lastSeen ? formatLastSeen(lastSeen) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="ro-right-panel">

            {/* Sensor Grid */}
            <div className="ro-sensor-grid">
              {[
                { icon: <FlaskConical size={16} />, cls: 'ph', label: 'pH', val: sensors.ph?.toFixed(2) },
                { icon: <Zap size={16} />, cls: 'ec', label: 'EC', val: sensors.ec_mscmn?.toFixed(2) },
                { icon: <Droplets size={16} />, cls: 'water', label: 'Water', val: `${sensors.water_level_pct?.toFixed(0)}%` },
                { icon: <Sun size={16} />, cls: 'light', label: 'Light', val: `${sensors.light_intensity_lux?.toFixed(0)} lx` },
              ].map(s => (
                <div key={s.cls} className={`ro-sensor-card ${s.cls}`}>
                  <div className="ro-sensor-icon">{s.icon}</div>
                  <span className="ro-sensor-label">{s.label}</span>
                  <span className="ro-sensor-value">{s.val || '--'}</span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="ro-chart-card">
              <div className="ro-chart-header">
                <h3>Trends (24h)</h3>
                <div className="ro-chart-tabs">
                  {Object.keys(chartConfigs).map(k => (
                    <button
                      key={k}
                      className={`ro-chart-tab ${chartMetric === k ? 'active' : ''}`}
                      onClick={() => setChartMetric(k)}
                    >
                      {chartConfigs[k].label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={rackHistoryData}>
                  <defs>
                    <linearGradient id={cfg.gId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cfg.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9}
                    tickLine={false} axisLine={false}
                    interval={Math.max(1, Math.floor(rackHistoryData.length / 6))}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.2)" fontSize={10}
                    tickLine={false} axisLine={false} domain={cfg.domain}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(15, 23, 15, 0.9)',
                      color: '#fff',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }}
                    formatter={v => [`${v?.toFixed(2)}${cfg.unit}`, cfg.label]}
                  />
                  <Area
                    type="monotone" dataKey={chartMetric}
                    stroke={cfg.color} strokeWidth={2}
                    fill={`url(#${cfg.gId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Controllers */}
            <div className="ro-ctrl-card">
              <h3>Controllers</h3>
              <div className="ro-ctrl-list">
                {[
                  { l: 'Nutrient Pump', v: controllers.nutrient_pump, type: 'status' },
                  { l: 'LED Power', v: controllers.led_power_pct, type: 'progress' },
                  { l: 'Concentration', v: controllers.concentration_controller_status, type: 'status' },
                  { l: 'Pesticide', v: controllers.pesticide_sprayer, type: 'status' },
                ].filter(c => c.v !== undefined).map(c => (
                  <div key={c.l} className="ro-ctrl-row">
                    <span className="ro-ctrl-label">{c.l}</span>
                    {c.type === 'progress' ? (
                      <div className="ro-ctrl-progress">
                        <div className="ro-ctrl-track">
                          <div className="ro-ctrl-fill" style={{ width: `${c.v}%` }} />
                        </div>
                        <span className="ro-ctrl-val">{c.v}%</span>
                      </div>
                    ) : (
                      <span className={`ro-ctrl-pill ${String(c.v).toLowerCase()}`}>{c.v}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Plant Detail */}
            {selectedPlant && (
              <div className="ro-plant-detail">
                <div className="ro-plant-detail-header">
                  <div className="ro-plant-detail-left">
                    <div className="ro-plant-emoji">{emoji}</div>
                    <div className="ro-plant-title">
                      <h4>{selectedPlant.plant_id}</h4>
                      <span>{currentRack.rack_id} · {currentRack.crop_type}</span>
                    </div>
                  </div>
                  <button className="ro-plant-close" onClick={() => setSelectedPlant(null)}>✕</button>
                </div>
                <div className="ro-plant-stats">
                  <div className="ro-plant-stat">
                    <div className="ro-plant-stat-label">Health</div>
                    <div className={`ro-plant-stat-val ${getHealthClass(selectedPlant.health_score)}`}>
                      {selectedPlant.health_score?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="ro-plant-stat">
                    <div className="ro-plant-stat-label">LAI</div>
                    <div className="ro-plant-stat-val">
                      {selectedPlant.lai_val?.toFixed(2)}
                    </div>
                  </div>
                  <div className="ro-plant-stat">
                    <div className="ro-plant-stat-label">Status</div>
                    <div className={`ro-plant-stat-val ${selectedPlant.ai_detected_anomaly && selectedPlant.ai_detected_anomaly !== 'None' ? 'poor' : 'excellent'}`}>
                      {selectedPlant.ai_detected_anomaly && selectedPlant.ai_detected_anomaly !== 'None' ? 'Alert' : 'Healthy'}
                    </div>
                  </div>
                </div>
                {selectedPlant.ai_detected_anomaly && selectedPlant.ai_detected_anomaly !== 'None' ? (
                  <div className="ro-plant-anomaly detected">
                    <AlertTriangle size={14} /> Anomaly: {selectedPlant.ai_detected_anomaly}
                  </div>
                ) : (
                  <div className="ro-plant-anomaly none">
                    <ShieldCheck size={14} /> No anomalies — Plant is healthy
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default RackOverlay;
