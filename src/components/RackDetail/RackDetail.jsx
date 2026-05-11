import React, { useEffect, useState, useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import historicalData from '../../data/historical_24h.json';
import {
  ArrowLeft, Droplets, Zap, Sun, FlaskConical,
  ShieldCheck, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FloorPlanMini, FloorPlanFull } from './FloorPlan';
import './RackDetail.css';

const CROP_EMOJI = { Lettuce: '🥬', Spinach: '🍃', Kale: '🥗', Basil: '🌿', Arugula: '🌱' };
const getHealthColor = (s) => { if (!s) return '#ccc'; if (s >= 95) return '#43A047'; if (s >= 85) return '#F9A825'; return '#C62828'; };
const getHealthClass = (s) => { if (s >= 95) return 'excellent'; if (s >= 85) return 'good'; return 'poor'; };

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

// ============ 3D TOWER COMPONENT ============
const Tower3D = ({ rack, rotation, onBowlClick, interactive }) => {
  const displayPlants = interactive ? rack.plants : rack.plants?.filter((_, i) => i % 8 === 0).slice(0, 5);
  const slots = buildSlots(rack.rack_id, displayPlants);
  const emoji = CROP_EMOJI[rack.crop_type] || '🌱';
  const LEVELS = 10;
  const BOWLS_PER_LEVEL = 4;

  return (
    <div className="tower-3d-rotator" style={interactive ? { transform: `rotateY(${rotation}deg)` } : {}}>
      <div className="tower-column white" />
      <div className="tower-base-plate" />

      {/* Level labels (non-3D, shown on the side) */}
      {interactive && Array.from({ length: LEVELS }, (_, lvlIdx) => {
        const lvl = lvlIdx + 1;
        const yPos = 85 - lvlIdx * 7.5;
        return (
          <div key={`lvl-${lvl}`} className="tower-level-tag" style={{ bottom: `${yPos}%` }}>
            L{lvl}
          </div>
        );
      })}

      {/* Levels with bowls */}
      {Array.from({ length: LEVELS }, (_, lvlIdx) => {
        const lvl = lvlIdx + 1;
        const yPos = 85 - lvlIdx * 7.5;
        return Array.from({ length: BOWLS_PER_LEVEL }, (_, bowlIdx) => {
          const slotNum = lvlIdx * BOWLS_PER_LEVEL + bowlIdx + 1;
          const slot = slots[slotNum - 1];
          const angle = bowlIdx * 90;
          const hasPlant = !!slot.data;

          return (
            <div key={slot.plant_id} className="tower-bowl-anchor"
              style={{
                bottom: `${yPos}%`,
                transform: `rotateY(${angle}deg) translateZ(${interactive ? 56 : 42}px)`
              }}>
              <div
                className={`tower-bowl ${hasPlant ? 'has-plant' : 'empty'} ${interactive ? 'clickable' : ''}`}
                onClick={interactive && hasPlant ? () => onBowlClick(slot.data) : undefined}
                title={hasPlant ? `${slot.plant_id} — L${lvl} — Health: ${slot.data.health_score?.toFixed(1)}%` : `${slot.plant_id} — L${lvl}`}
              >
                <div className="bowl-cup" />
                {hasPlant && (
                  <div className="bowl-plant">
                    <span className="bowl-emoji">{emoji}</span>
                    <div className="bowl-health-dot" style={{ background: getHealthColor(slot.data.health_score) }} />
                  </div>
                )}
                {interactive && (
                  <span className="bowl-label">{String(slotNum).padStart(2, '0')}</span>
                )}
              </div>
            </div>
          );
        });
      })}
    </div>
  );
};

// ============ MAIN COMPONENT ============
const RackDetail = () => {
  const [allDocs, setAllDocs] = useState(historicalData);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('overview'); // overview | rack | plant
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [hoveredRackId, setHoveredRackId] = useState(null);
  const [chartMetric, setChartMetric] = useState('ph');
  const [rotation, setRotation] = useState(-30);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [rotStart, setRotStart] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const itemsPerPage = 12;

  useEffect(() => {
    const q = query(collection(db, "telemetry"), orderBy("room_data.timestamp", "asc"), limit(288));
    const unsub = onSnapshot(q, (snap) => {
      const docs = [];
      snap.forEach(d => docs.push(d.data()));
      if (docs.length > 0) {
        setAllDocs(docs);
      } else {
        setAllDocs(historicalData);
      }
      setLoading(false);
    }, (error) => {
      console.error('RackDetail Firestore error:', error);
      setAllDocs(historicalData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const latestDoc = allDocs.length > 0 ? allDocs[allDocs.length - 1] : null;
  const racks = latestDoc?.room_data?.racks || [];
  
  // Pagination logic
  const totalPages = Math.ceil(racks.length / itemsPerPage);
  const paginatedRacks = racks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const currentRack = useMemo(() => selectedRackId ? racks.find(r => r.rack_id === selectedRackId) : null, [selectedRackId, racks]);

  const rackHistoryData = useMemo(() => {
    if (!selectedRackId || !allDocs.length) return [];
    return allDocs.map(doc => {
      const rack = doc.room_data.racks?.find(r => r.rack_id === selectedRackId);
      if (!rack) return null;
      const ts = new Date(doc.room_data.timestamp);
      return { time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), ph: rack.rack_sensors?.ph, ec: rack.rack_sensors?.ec_mscmn, water: rack.rack_sensors?.water_level_pct, light: rack.rack_sensors?.light_intensity_lux };
    }).filter(Boolean);
  }, [selectedRackId, allDocs]);

  const plantHistoryData = useMemo(() => {
    if (!selectedPlant || !selectedRackId || !allDocs.length) return [];
    return allDocs.map(doc => {
      const rack = doc.room_data.racks?.find(r => r.rack_id === selectedRackId);
      const plant = rack?.plants?.find(p => p.plant_id === selectedPlant.plant_id);
      if (!plant) return null;
      const ts = new Date(doc.room_data.timestamp);
      return { time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), health: plant.health_score, lai: plant.lai_val };
    }).filter(Boolean);
  }, [selectedPlant, selectedRackId, allDocs]);

  // Drag handlers
  const onMouseDown = (e) => { setIsDragging(true); setDragStart(e.clientX); setRotStart(rotation); };
  const onMouseMove = (e) => { if (!isDragging) return; setRotation(rotStart + (e.clientX - dragStart) * 0.5); };
  const onMouseUp = () => setIsDragging(false);
  const spinLeft = () => setRotation(r => r + 45);
  const spinRight = () => setRotation(r => r - 45);

  const handlePageInputChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setPageInput(val);
    }
  };

  const handlePageJump = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const page = parseInt(pageInput);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      } else {
        setPageInput(String(currentPage));
      }
    }
  };

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const openRack = (rackId) => { setSelectedRackId(rackId); setView('rack'); setRotation(-30); setIsFloorPlanOpen(false); };
  const openPlant = (plant) => { setSelectedPlant(plant); setView('plant'); };
  const openFloorPlan = () => { setIsFloorPlanOpen(true); };
  const goBack = () => {
    if (view === 'plant') { setSelectedPlant(null); setView('rack'); }
    else if (view === 'rack') { setSelectedRackId(null); setView('overview'); }
  };

  const chartConfigs = {
    ph: { label: 'pH', color: '#43A047', gId: 'gPh', domain: [4, 8], unit: '' },
    ec: { label: 'EC', color: '#F9A825', gId: 'gEc', domain: [0, 3], unit: ' mS/cm' },
    water: { label: 'Water', color: '#1565C0', gId: 'gW', domain: [0, 100], unit: '%' },
    light: { label: 'Light', color: '#E65100', gId: 'gL', domain: [0, 'auto'], unit: ' lux' },
  };

  if (loading) return (
    <main className="rack-detail-main"><div className="rack-loading"><div className="spinner" /><span>Loading rack data...</span></div></main>
  );

  // ========== LEVEL 1: OVERVIEW ==========
  const renderOverview = () => (
    <div className="rack-overview-container">
      <div className="rack-overview-grid">
        {paginatedRacks.map(rack => (
          <div 
            key={rack.rack_id} 
            className={`rack-block tall ${hoveredRackId === rack.rack_id ? 'is-hovered' : ''}`} 
            onClick={() => openRack(rack.rack_id)}
            onMouseEnter={() => setHoveredRackId(rack.rack_id)}
            onMouseLeave={() => setHoveredRackId(null)}
          >
            <div className="rack-block-header">
              <span className="rbh-name">{rack.rack_id.replace('rack_', 'Rack ')}</span>
              <span className="rbh-crop">{rack.crop_type}</span>
            </div>
            <div className="rack-block-tower-full">
              <div className="tower-3d-scene tall">
                <Tower3D rack={rack} rotation={-25} interactive={false} />
              </div>
            </div>
            <div className="rack-block-footer">
              <span className="rbf-stat">{rack.plants?.length || 0}/40 Plants</span>
            </div>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="rack-pagination">
          <button 
            className="pag-btn" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={28} />
          </button>
          <div className="pag-info">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="pag-jump">
              <span className="jump-label">Go to</span>
              <input 
                type="text" 
                value={pageInput} 
                onChange={handlePageInputChange}
                onKeyDown={handlePageJump}
                onBlur={handlePageJump}
                className="pag-input"
              />
            </div>
            <div className="pag-dots">
              {Array.from({ length: totalPages }, (_, i) => (
                <div 
                  key={i} 
                  className={`pag-dot ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                />
              ))}
            </div>
          </div>
          <button 
            className="pag-btn" 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </div>
  );

  // ========== LEVEL 2: RACK DETAIL (SPIN) ==========
  const renderRackView = () => {
    if (!currentRack) return null;
    const sensors = currentRack.rack_sensors || {};
    const controllers = currentRack.rack_controllers || {};
    const plants = currentRack.plants || [];
    const avgHealth = plants.length > 0 ? plants.reduce((s, p) => s + (p.health_score || 0), 0) / plants.length : 0;
    const cfg = chartConfigs[chartMetric];

    return (
      <div className="rack-spin-layout">
        <div className="rack-spin-left no-bg">
          <div className="spin-controls outside">
            <button onClick={spinLeft}><ChevronLeft size={18} /></button>
            <span className="spin-hint">Drag to spin · Click a plant bowl</span>
            <button onClick={spinRight}><ChevronRight size={18} /></button>
          </div>
          <div className="tower-3d-scene full"
            onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            <Tower3D rack={currentRack} rotation={rotation} onBowlClick={openPlant} interactive={true} />
          </div>
        </div>

        {/* RIGHT: Info Panels */}
        <div className="rack-spin-right">
          <div className="rack-info-header-simple">
            <h2>{currentRack.rack_id}</h2>
            <span className="rack-info-sub-simple">{currentRack.crop_type} · {plants.length}/40 plants · Avg {avgHealth.toFixed(1)}%</span>
          </div>

          <div className="rack-sensor-grid-2x2">
            {[
              { icon: FlaskConical, cls: 'ph', label: 'PH', val: sensors.ph?.toFixed(2), unit: '' },
              { icon: Zap, cls: 'ec', label: 'EC', val: sensors.ec_mscmn?.toFixed(2), unit: ' mS/cm' },
              { icon: Droplets, cls: 'water', label: 'WATER', val: sensors.water_level_pct?.toFixed(0), unit: '%' },
              { icon: Sun, cls: 'light', label: 'LIGHT', val: sensors.light_intensity_lux?.toFixed(0), unit: ' lx' },
            ].map(s => (
              <div key={s.cls} className="stat-card status-optimal">
                <div className="stat-card-header">
                  <div className="stat-icon-wrapper">
                    <s.icon size={18} />
                  </div>
                  <span className="stat-label">{s.label}</span>
                </div>
                <div className="stat-card-body">
                  <span className="stat-value">{s.val || '--'}</span>
                  <span className="stat-unit">{s.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rack-chart-card-simple">
            <div className="rcc-header-simple">
              <h3>Trends (24h)</h3>
              <div className="rcc-tabs-simple">
                {Object.keys(chartConfigs).map(k => (
                  <button key={k} className={chartMetric === k ? 'active' : ''} onClick={() => setChartMetric(k)}>{chartConfigs[k].label}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={rackHistoryData}>
                <defs><linearGradient id={cfg.gId} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={cfg.color} stopOpacity={0.2}/><stop offset="95%" stopColor={cfg.color} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                <XAxis dataKey="time" stroke="#999" fontSize={9} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(rackHistoryData.length/6))}/>
                <YAxis stroke="#999" fontSize={10} tickLine={false} axisLine={false} domain={cfg.domain}/>
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} formatter={v => [`${v?.toFixed(2)}${cfg.unit}`, cfg.label]}/>
                <Area type="monotone" dataKey={chartMetric} stroke={cfg.color} strokeWidth={2} fill={`url(#${cfg.gId})`}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rack-ctrl-card-simple">
            <h3>Controllers</h3>
            <div className="ctrl-list-simple">
              {[
                { l: 'Nutrient Pump', v: controllers.nutrient_pump, type: 'status' },
                { l: 'LED Power', v: controllers.led_power_pct, type: 'progress' },
                { l: 'Concentration', v: controllers.concentration_controller_status, type: 'status' },
                { l: 'Pesticide', v: controllers.pesticide_sprayer, type: 'status' },
              ].filter(c => c.v !== undefined).map(c => (
                <div key={c.l} className="ctrl-row-simple">
                  <span className="ctrl-label-simple">{c.l}</span>
                  {c.type === 'progress' ? (
                    <div className="ctrl-progress-container">
                      <div className="ctrl-progress-track">
                        <div className="ctrl-progress-fill" style={{ width: `${c.v}%` }} />
                      </div>
                      <span className="ctrl-progress-val">{c.v}%</span>
                    </div>
                  ) : (
                    <span className={`ctrl-status-pill ${String(c.v).toLowerCase()}`}>{c.v}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== LEVEL 3: PLANT PAGE ==========
  const renderPlantView = () => {
    if (!selectedPlant || !currentRack) return null;
    const anomaly = selectedPlant.ai_detected_anomaly;
    const hasAnomaly = anomaly && anomaly !== 'None';
    const emoji = CROP_EMOJI[currentRack.crop_type] || '🌱';

    return (
      <div className="plant-page">
        <div className="plant-page-header">
          <span className="pp-emoji">{emoji}</span>
          <div>
            <h2>{selectedPlant.plant_id}</h2>
            <span className="pp-sub">{currentRack.rack_id} · {currentRack.crop_type}</span>
          </div>
        </div>

        <div className="plant-page-stats">
          {[
            { label: 'Health Score', val: selectedPlant.health_score?.toFixed(1), unit: '%', icon: ShieldCheck },
            { label: 'LAI Value', val: selectedPlant.lai_val?.toFixed(2), unit: '', icon: Sun },
            { label: 'Status', val: hasAnomaly ? 'Alert' : 'Healthy', unit: '', icon: AlertTriangle, status: hasAnomaly ? 'warning' : 'optimal' }
          ].map(s => (
            <div key={s.label} className={`stat-card status-${s.status || 'optimal'}`}>
              <div className="stat-card-header">
                <div className="stat-icon-wrapper">
                  <s.icon size={18} />
                </div>
                <span className="stat-label">{s.label}</span>
              </div>
              <div className="stat-card-body">
                <span className={`stat-value ${s.status ? `health-${s.status}` : ''}`}>{s.val}</span>
                <span className="stat-unit">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`pp-anomaly ${hasAnomaly ? 'detected' : 'none'}`}>
          {hasAnomaly ? <><AlertTriangle size={16}/> Anomaly: {anomaly}</> : <><ShieldCheck size={16}/> No anomalies — Plant is healthy</>}
        </div>

        {plantHistoryData.length > 1 && (
          <div className="plant-page-charts">
            <div className="ppc-card">
              <h4>Health Score Trend (24h)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={plantHistoryData}>
                  <defs><linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#43A047" stopOpacity={0.3}/><stop offset="95%" stopColor="#43A047" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                  <XAxis dataKey="time" stroke="#999" fontSize={9} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(plantHistoryData.length/6))}/>
                  <YAxis stroke="#999" fontSize={10} tickLine={false} axisLine={false} domain={[90, 100]}/>
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none' }} formatter={v => [`${v?.toFixed(1)}%`, 'Health']}/>
                  <Area type="basis" dataKey="health" stroke="#43A047" strokeWidth={2} fill="url(#hGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="ppc-card">
              <h4>LAI Trend (24h)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={plantHistoryData}>
                  <defs><linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1565C0" stopOpacity={0.3}/><stop offset="95%" stopColor="#1565C0" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                  <XAxis dataKey="time" stroke="#999" fontSize={9} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(plantHistoryData.length/6))}/>
                  <YAxis stroke="#999" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']}/>
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none' }} formatter={v => [v?.toFixed(2), 'LAI']}/>
                  <Area type="basis" dataKey="lai" stroke="#1565C0" strokeWidth={2} fill="url(#lGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========== RENDER ==========
  const titles = {
    overview: 'Rack Overview',
    rack: currentRack?.rack_id || '',
    plant: selectedPlant?.plant_id || ''
  };
  const subtitles = {
    overview: `Vertical Lab 01 · ${racks.length} Active Racks`,
    rack: `${currentRack?.crop_type || ''} · ${currentRack?.plants?.length || 0}/40 plants`,
    plant: `${currentRack?.rack_id || ''} · ${currentRack?.crop_type || ''}`
  };

  return (
    <main className="rack-detail-main">
      <header className="rack-detail-header">
        <div className="rack-header-left">
          {view !== 'overview' && (
            <div className="rack-back-btn" onClick={goBack}><ArrowLeft size={20}/></div>
          )}
          <div className="rack-header-title">
            <h1>{titles[view]}</h1>
            <span className="rack-subtitle">{subtitles[view]}</span>
          </div>
        </div>
        <div className="rack-header-right">
          <div className="rack-header-stats">
            <div className="rack-mini-stat"><span className="label">Racks</span><span className="value">{racks.length}</span></div>
            <div className="rack-mini-stat"><span className="label">Plants</span><span className="value">{racks.reduce((s, r) => s + (r.plants?.length || 0), 0)}</span></div>
          </div>
          {view === 'overview' ? (
            <FloorPlanMini racks={racks} onClick={openFloorPlan} hoveredRackId={hoveredRackId} />
          ) : (
            <div className="fp-label-only clickable" onClick={openFloorPlan}>
              <div className="fp-mini-pulse" />
              <span>2D FLOOR PLAN</span>
            </div>
          )}
        </div>
      </header>

      {view === 'overview' && renderOverview()}
      {view === 'rack' && renderRackView()}
      {view === 'plant' && renderPlantView()}

      {isFloorPlanOpen && (
        <div className="fp-modal-overlay" onClick={() => setIsFloorPlanOpen(false)}>
          <div className="fp-modal-content" onClick={e => e.stopPropagation()}>
            <button className="fp-modal-close" onClick={() => setIsFloorPlanOpen(false)}>×</button>
            <FloorPlanFull racks={racks} onRackClick={openRack} selectedRackId={selectedRackId} />
          </div>
        </div>
      )}
    </main>
  );
};

export default RackDetail;
