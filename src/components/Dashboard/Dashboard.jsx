import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import StatCard from '../StatCard/StatCard';
import HistoricalCharts from '../Charts/HistoricalCharts';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  Thermometer, 
  Droplets, 
  Zap,
  Waves,
  FlaskConical,
  ShieldCheck,
  ArrowUpRight,
  Search,
  Fan,
  Sun,
  Wind,
  Layers,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const Dashboard = () => {
  const [latestData, setLatestData] = useState(null);
  const [latestDocId, setLatestDocId] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "telemetry"),
      orderBy("room_data.timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        setLatestData(doc.data());
        setLatestDocId(doc.id);
      });
    });

    return () => unsubscribe();
  }, []);

  const room = latestData?.room_data;
  const actuators = room?.global_actuators;
  const racks = room?.racks || [];

  const handleToggle = async (category, unitId) => {
    if (!latestDocId || !latestData) return;

    try {
      const newData = JSON.parse(JSON.stringify(latestData));
      const targetActuators = newData.room_data.global_actuators;
      
      let unit;
      if (category === 'ac') unit = targetActuators.ac_units.find(u => u.id === unitId);
      if (category === 'fan') unit = targetActuators.fan_units.find(u => u.id === unitId);
      if (category === 'sprayer') unit = targetActuators.sprayer_units.find(u => u.id === unitId);
      if (category === 'light') unit = targetActuators.light_intensity.find(u => u.id === unitId);

      if (unit) {
        unit.status = unit.status === 'ON' ? 'OFF' : 'ON';
        await updateDoc(doc(db, "telemetry", latestDocId), newData);
      }
    } catch (error) {
      console.error("Error toggling actuator:", error);
    }
  };

  return (
    <main className="dashboard-main">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="back-btn"><ArrowUpRight rotate={-135} size={20} /></div>
          <div className="header-title">
            <h1>System Overview</h1>
            <span className="coordinates">Vertical Lab 01 • Last Update: {room?.timestamp ? new Date(room.timestamp).toLocaleTimeString() : '--'}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search sensors, crops..." />
          </div>
          <div className="header-stats">
            <div className="mini-stat">
              <span className="mini-label">Active Racks</span>
              <span className="mini-value info">{racks.length}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-label">System Mode</span>
              <span className="mini-value success">Manual Control</span>
            </div>
          </div>
        </div>
      </header>

      <section className="top-summary">
        <div className="summary-cards">
          <StatCard 
            icon={Thermometer} 
            label="Temperature" 
            value={room?.ambient_sensors?.temp || '--'} 
            unit="°C" 
            status={room?.ambient_sensors?.temp > 28 ? "warning" : "optimal"} 
          />
          <StatCard 
            icon={Droplets} 
            label="Ambient Humidity" 
            value={room?.ambient_sensors?.humidity || '--'} 
            unit="%" 
            status="optimal" 
          />
          <StatCard 
            icon={Zap} 
            label="Total Electricity" 
            value={room?.resource_trackers?.total_electricity_kwh || '--'} 
            unit="kWh" 
            status="optimal" 
          />
          <StatCard 
            icon={Waves} 
            label="Total Water" 
            value={room?.resource_trackers?.total_water_litres || '--'} 
            unit="L" 
            status="optimal" 
          />
          <StatCard 
            icon={FlaskConical} 
            label="Total Fertilizer" 
            value={room?.resource_trackers?.total_fertilizer_ml || '--'} 
            unit="ml" 
            status="optimal" 
          />
          <StatCard 
            icon={ShieldCheck} 
            label="Total Pesticide" 
            value={room?.resource_trackers?.total_pesticide_ml || '0'} 
            unit="ml" 
            status="optimal" 
          />
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="grid-left">
          {/* Actuator Status Section */}
          <section className="actuator-overview card">
            <div className="card-header">
              <h3>System Actuators</h3>
              <span className="count-tag">{
                (actuators?.ac_units?.length || 0) + 
                (actuators?.fan_units?.length || 0) + 
                (actuators?.sprayer_units?.length || 0) + 
                (actuators?.light_intensity?.length || 0)
              } Total Units</span>
            </div>
            <div className="actuator-grid">
              <div className="actuator-group">
                <div className="group-label"><Wind size={16} /> AC Units ({actuators?.ac_units?.length || 0})</div>
                <div className="unit-list">
                  {actuators?.ac_units?.map(u => (
                    <div key={u.id} className={`unit-pill ${u.status === 'ON' ? 'active' : ''}`}>
                      <div className="unit-info">
                        <strong>{u.id}</strong>
                        <span>{u.status} ({u.temp}°C)</span>
                      </div>
                      <button className="toggle-btn" onClick={() => handleToggle('ac', u.id)}>
                        {u.status === 'ON' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="actuator-group">
                <div className="group-label"><Fan size={16} /> Fans ({actuators?.fan_units?.length || 0})</div>
                <div className="unit-list">
                  {actuators?.fan_units?.map(u => (
                    <div key={u.id} className={`unit-pill ${u.status === 'ON' ? 'active' : ''}`}>
                      <div className="unit-info">
                        <strong>{u.id}</strong>
                        <span>{u.status} (Lvl {u.speed_level})</span>
                      </div>
                      <button className="toggle-btn" onClick={() => handleToggle('fan', u.id)}>
                        {u.status === 'ON' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="actuator-group">
                <div className="group-label"><Droplets size={16} /> Sprayers ({actuators?.sprayer_units?.length || 0})</div>
                <div className="unit-list">
                  {actuators?.sprayer_units?.map(u => (
                    <div key={u.id} className={`unit-pill ${u.status === 'ON' ? 'active' : ''}`}>
                      <div className="unit-info">
                        <strong>{u.id}</strong>
                        <span>{u.status}</span>
                      </div>
                      <button className="toggle-btn" onClick={() => handleToggle('sprayer', u.id)}>
                        {u.status === 'ON' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="actuator-group">
                <div className="group-label"><Sun size={16} /> Lights ({actuators?.light_intensity?.length || 0})</div>
                <div className="unit-list">
                  {actuators?.light_intensity?.map(u => (
                    <div key={u.id} className={`unit-pill ${u.status === 'ON' ? 'active' : ''}`}>
                      <div className="unit-info">
                        <strong>{u.id}</strong>
                        <span>{u.status} ({u.level}%)</span>
                      </div>
                      <button className="toggle-btn" onClick={() => handleToggle('light', u.id)}>
                        {u.status === 'ON' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <HistoricalCharts />
        </div>

        <div className="grid-right">
          <section className="rack-overview card">
            <div className="card-header">
              <h3>Rack Deployment</h3>
              <span className="count-tag">{racks.length} Racks</span>
            </div>
            <div className="rack-list">
              {racks.map(r => (
                <div key={r.rack_id} className="rack-item">
                  <div className="rack-info">
                    <div className="rack-title">
                      <Layers size={18} />
                      <strong>{r.rack_id}</strong>
                      <span className="crop-tag">{r.crop_type}</span>
                    </div>
                    <div className="rack-stats">
                      <span>pH: <strong>{r.rack_sensors.ph}</strong></span>
                      <span>EC: <strong>{r.rack_sensors.ec_mscmn}</strong></span>
                      <span>Water: <strong>{r.rack_sensors.water_level_pct}%</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="ai-advisor-card">
            <div className="advisor-header">
              <div className="ai-avatar">🤖</div>
              <h4>AI Growth Insights</h4>
            </div>
            <ul className="advisor-tips">
              <li>💡 {room?.ambient_sensors?.temp > 27 ? 'High temperature detected. Increasing fan speed for optimal cooling.' : 'Temperature is stable. Lighting cycle is at peak efficiency.'}</li>
              <li>🧪 {racks[0]?.rack_sensors.ph < 5.5 ? 'pH level low in Rack 0101. Auto-adjusting nutrient mix.' : 'Nutrient levels are within optimal range.'}</li>
              <li>💧 Water optimization: Current cycle is {racks[0]?.rack_sensors?.water_level_pct > 80 ? '98%' : '90%'} efficient.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
