import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Climate.css';
import { 
  Thermometer, 
  CloudSun, 
  Wind, 
  Sun,
  Activity,
  ArrowUpRight,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Sprout,
  CloudRain,
  ShieldCheck,
  Droplets,
  Bell,
  BellOff,
  X
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

const INTELLIGENCE_API = 'http://localhost:5001';

const data = [
  { time: '00:00', temp: 22, humidity: 65, co2: 800 },
  { time: '04:00', temp: 20, humidity: 70, co2: 820 },
  { time: '08:00', temp: 24, humidity: 60, co2: 850 },
  { time: '12:00', temp: 28, humidity: 55, co2: 900 },
  { time: '16:00', temp: 26, humidity: 58, co2: 880 },
  { time: '20:00', temp: 23, humidity: 62, co2: 840 },
];

const SENSOR_LABELS = {
  ph: 'pH Level',
  ec_level: 'EC Level',
  temp_c: 'Temperature',
  humidity_pct: 'Humidity',
  water_temp_c: 'Water Temp',
};

const SENSOR_ICONS = {
  ph: Activity,
  ec_level: Zap,
  temp_c: Thermometer,
  humidity_pct: CloudSun,
  water_temp_c: Thermometer,
};

const STATUS_COLORS = {
  STABLE: 'var(--primary-green)',
  WATCH: '#2196F3',
  WARNING: '#FF9800',
  CRITICAL: '#F44336',
};

const SENSOR_METRICS = {
  temp: { label: 'Air Temp', unit: '°C', color: '#FF5722', apiKey: 'temp_c', yAxisId: 'left', domain: [0, 40] },
  humidity: { label: 'Humidity', unit: '%', color: '#2196F3', apiKey: 'humidity_pct', yAxisId: 'left', domain: [0, 100] },
  ph: { label: 'pH Level', unit: '', color: '#4CAF50', apiKey: 'ph', yAxisId: 'left', domain: [4, 9] },
  water_temp: { label: 'Water Temp', unit: '°C', color: '#00BCD4', apiKey: 'water_temp_c', yAxisId: 'left', domain: [0, 40] },
  ec: { label: 'EC Level', unit: 'µS/cm', color: '#3A5A40', apiKey: 'ec_level', yAxisId: 'left', domain: [500, 2500] }
};

const SensorTrendChart = ({ metricKey, historyData }) => {
  const metric = SENSOR_METRICS[metricKey];
  const [showForecast, setShowForecast] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchForecast = async () => {
    if (forecastData.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${INTELLIGENCE_API}/api/predict?sensor=${metric.apiKey}&horizon=96`);
      if (res.ok) {
        const data = await res.json();
        let predictions = data.predictions || [];
        
        // --- ANOMALY OVERRIDE FOR FORECAST ---
        const activeAnomaly = localStorage.getItem('simulation_anomaly') || 'none';
        if (activeAnomaly !== 'none') {
          predictions = predictions.map((p, idx) => {
            const newP = { ...p };
            if (activeAnomaly === 'heatwave' && metricKey === 'temp') {
              newP.value = 31.42 + (idx * 0.1); // Continue rising
            } else if (activeAnomaly === 'heatwave' && metricKey === 'humidity') {
              newP.value = 42.1 - (idx * 0.2); // Continue falling
            } else if (activeAnomaly === 'ph_failure' && metricKey === 'ph') {
              newP.value = 7.42 + (idx * 0.05); // Continue rising
            } else if (activeAnomaly === 'sensor_malfunction' && metricKey === 'ec') {
              newP.value = 0.0; // Stay at zero
            }
            return newP;
          });
        }
        
        setForecastData(predictions);
      }
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleForecast = () => {
    if (!showForecast) {
      fetchForecast();
    }
    setShowForecast(!showForecast);
  };

  return (
    <div className="main-chart-card sensor-chart-card">
      <div className="chart-header">
        <h3>{metric.label} Trends</h3>
        <button 
          className={`toggle-forecast-btn ${showForecast ? 'active' : ''}`}
          onClick={toggleForecast}
          disabled={loading}
        >
          <TrendingUp size={14} />
          {loading ? 'Loading...' : showForecast ? 'Hide Forecast' : 'Show Forecast'}
        </button>
      </div>
      <div className="chart-wrapper-animated">
        {/* Left Side: History */}
        <motion.div 
          className="history-chart-segment"
          initial={false}
          animate={{ flex: showForecast ? 1 : 2 }} // Effectively 50% vs 100%
          transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historyData} margin={{ right: 0, left: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="time" 
                stroke="#888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                interval="preserveStartEnd"
                minTickGap={40}
                hide={false}
              />
              <YAxis 
                stroke="#888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                domain={metric.domain}
                unit={metric.unit}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255,255,255,0.9)', 
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={metricKey} 
                stroke={metric.color} 
                strokeWidth={3} 
                dot={false}
                isAnimationActive={false} // Disable Recharts animation to let Framer Motion handle the "slide"
              />
              {showForecast && (
                <ReferenceLine x={historyData[historyData.length - 1]?.time} stroke="#888" strokeDasharray="3 3" label={{ position: 'top', value: 'Now', fill: '#888', fontSize: 10 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Right Side: Forecast */}
        <AnimatePresence>
          {showForecast && (
            <motion.div 
              className="forecast-chart-segment"
              initial={{ width: 0, opacity: 0, flex: 0 }}
              animate={{ width: 'auto', opacity: 1, flex: 1 }}
              exit={{ width: 0, opacity: 0, flex: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
              style={{ overflow: 'hidden' }}
            >
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={forecastData} margin={{ left: 0, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={val => `+${val}h`}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />
                  <YAxis hide domain={metric.domain} />
                  <Tooltip 
                    labelFormatter={val => `+${val}h`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)', 
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={`${metric.label} (Forecast)`}
                    stroke={metric.color} 
                    strokeWidth={3} 
                    strokeDasharray="5 5" 
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Climate = () => {
  const [insightsData, setInsightsData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeAnomaly, setActiveAnomaly] = useState(localStorage.getItem('simulation_anomaly') || 'none');
  const [notifications, setNotifications] = useState([]);
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

  // Auto-dismiss banner after 5 seconds
  useEffect(() => {
    if (insightsData && (insightsData.overall_status === 'WARNING' || insightsData.overall_status === 'CRITICAL')) {
      const timer = setTimeout(() => {
        setBannerDismissed(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [insightsData]);

  // Capture notifications from insights
  useEffect(() => {
    if (insightsData?.sensor_insights?.length > 0) {
      const latestMsg = insightsData.sensor_insights[0];
      // Avoid duplicate notifications for the same message
      if (!notifications.some(n => n.message === latestMsg)) {
        const newNotif = {
          id: Date.now(),
          type: insightsData.overall_status,
          message: latestMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 10)); // Keep last 10
      }
    }
  }, [insightsData]);

  // Listen for anomaly simulation changes
  useEffect(() => {
    const interval = setInterval(() => {
      const mode = localStorage.getItem('simulation_anomaly') || 'none';
      if (mode !== activeAnomaly) {
        setActiveAnomaly(mode);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeAnomaly]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [insightsRes, forecastRes, historyRes] = await Promise.all([
          fetch(`${INTELLIGENCE_API}/api/insights`).catch(() => null),
          fetch(`${INTELLIGENCE_API}/api/forecast`).catch(() => null),
          fetch(`${INTELLIGENCE_API}/api/history?limit=24`).catch(() => null),
        ]);

        if (insightsRes && insightsRes.ok) {
          let iData = await insightsRes.json();
          
          // --- ANOMALY OVERRIDE ---
          if (activeAnomaly !== 'none') {
            if (activeAnomaly === 'heatwave') {
              iData.overall_status = 'CRITICAL';
              iData.sensor_insights = ["CRITICAL: Temperature spike detected (31.4°C). System fans at 100%."];
              iData.recommended_actions = ["Check cooling unit", "Increase ventilation"];
              
              if (iData.sensor_trends) {
                if (iData.sensor_trends.temp_c) {
                  iData.sensor_trends.temp_c.status = 'CRITICAL';
                  iData.sensor_trends.temp_c.current = 31.42;
                  iData.sensor_trends.temp_c.direction = 'rising';
                  iData.sensor_trends.temp_c.predicted_1h = 32.5;
                  iData.sensor_trends.temp_c.automation_response = 'Cooling fans increased to 100%';
                }
                if (iData.sensor_trends.humidity_pct) {
                  iData.sensor_trends.humidity_pct.status = 'WATCH';
                  iData.sensor_trends.humidity_pct.current = 42.1;
                  iData.sensor_trends.humidity_pct.direction = 'falling';
                  iData.sensor_trends.humidity_pct.automation_response = 'Exhaust fans activated at 70%';
                }
              }
            } else if (activeAnomaly === 'ph_failure') {
              iData.overall_status = 'CRITICAL';
              iData.sensor_insights = ["CRITICAL: Water pH is dangerously high (7.4). Dosing pump engaged."];
              iData.recommended_actions = ["Add pH Down", "Calibrate pH probe"];
              
              if (iData.sensor_trends && iData.sensor_trends.ph) {
                iData.sensor_trends.ph.status = 'CRITICAL';
                iData.sensor_trends.ph.current = 7.42;
                iData.sensor_trends.ph.direction = 'rising';
                iData.sensor_trends.ph.automation_response = 'pH-down dosing pump activated';
              }
            } else if (activeAnomaly === 'sensor_malfunction') {
              iData.overall_status = 'WARNING';
              iData.sensor_insights = ["WARNING: EC Sensor reporting zero. Possible hardware failure."];
              iData.recommended_actions = ["Inspect EC sensor", "Clean electrodes"];
              
              if (iData.sensor_trends && iData.sensor_trends.ec_level) {
                iData.sensor_trends.ec_level.status = 'CRITICAL';
                iData.sensor_trends.ec_level.current = 0.00;
                iData.sensor_trends.ec_level.direction = 'falling';
                iData.sensor_trends.ec_level.automation_response = 'Sensor error: Signal lost';
              }
            }
          }
          
          setInsightsData(iData);
        }

        if (forecastRes && forecastRes.ok) {
          const fData = await forecastRes.json();
          setForecastData(fData);
        }

        if (historyRes && historyRes.ok) {
          let hData = await historyRes.json();
          let history = hData.history || [];
          
          // --- ANOMALY OVERRIDE FOR HISTORY ---
          if (activeAnomaly !== 'none' && history.length > 0) {
            history = history.map((point, idx) => {
              const newPoint = { ...point };
              if (activeAnomaly === 'heatwave' && idx > 15) {
                newPoint.temp_c = 27 + (idx - 15) * 0.6; // Upward spike
                newPoint.humidity_pct = 58 - (idx - 15) * 2.0; // Downward drop
              } else if (activeAnomaly === 'ph_failure' && idx > 18) {
                newPoint.ph = 6.2 + (idx - 18) * 0.25;
              } else if (activeAnomaly === 'sensor_malfunction' && idx > 10) {
                newPoint.ec_level = 0.0;
              }
              return newPoint;
            });
          }
          
          setHistoryData(history);
        }

        setLastUpdated(new Date().toLocaleTimeString());
      } catch {
        // Silently fail — do not break the dashboard
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [activeAnomaly]);

  const showBanner = insightsData && !bannerDismissed && 
    (insightsData.overall_status === 'WARNING' || insightsData.overall_status === 'CRITICAL');

  return (
    <div className="climate-view">
      <div className="climate-container">
        {/* Alert Banner Section */}
          {!insightsData && (
            <div className="forecast-banner forecast-banner--stable" style={{ opacity: 0.7 }}>
              <div className="banner-content">
                <div className="banner-icon"><Clock size={20} /></div>
                <div className="banner-text">
                  <span className="banner-status">CONNECTING</span>
                  <span className="banner-message">Establishing link with Intelligence Engine (Port 5001)...</span>
                </div>
              </div>
            </div>
          )}
          <AnimatePresence>
            {showBanner && (
              <motion.div 
                key="alert-banner"
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ 
                  x: '40vw', 
                  y: -100, 
                  scale: 0.1, 
                  opacity: 0,
                  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                }}
                className={`forecast-banner forecast-banner--${insightsData?.overall_status?.toLowerCase() || 'stable'}`}
                onAnimationComplete={(definition) => {
                  // After fly animation finishes, we could trigger a bell shake if needed, 
                  // but React state handles it better
                }}
              >
                <div className="banner-content">
                  <div className="banner-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="banner-text">
                    <span className="banner-status">{insightsData?.overall_status}</span>
                    <span className="banner-message">
                      {insightsData?.sensor_insights?.[0] || 'Anomaly detected'}
                    </span>
                    {insightsData?.recommended_actions?.length > 0 && (
                      <span className="banner-actions">
                        Actions: {insightsData.recommended_actions.join(' → ')}
                      </span>
                    )}
                    {/* Automation Response */}
                    {insightsData?.sensor_trends && Object.values(insightsData.sensor_trends || {}).some(s => s?.automation_response) && (
                      <span className="banner-automation">
                        ⚡ {Object.values(insightsData.sensor_trends || {}).find(s => s?.automation_response)?.automation_response}
                      </span>
                    )}
                  </div>
                  <button className="banner-dismiss" onClick={() => setBannerDismissed(true)}>
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ... (Header Section) */}
          <header className="view-header">
            <div className="header-title-row">
              <div>
                <h1>Environment Intelligence</h1>
                <p>Predictive analytics for atmospheric and hydroponic systems.</p>
              </div>
              <div className="header-actions">
                {lastUpdated && (
                  <div className="last-updated-badge">
                    <Clock size={14} />
                    <span>Last updated: {lastUpdated}</span>
                  </div>
                )}
                
                {/* Notification Bell */}
                <div className="notification-hub" ref={notifRef}>
                  <motion.button 
                    className={`bell-btn ${notifications.some(n => !n.read) ? 'has-unread' : ''}`}
                    onClick={() => {
                      setShowNotifPanel(!showNotifPanel);
                      // Mark all as read when opening
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    }}
                    animate={notifications.some(n => !n.read) ? {
                      rotate: [0, -15, 15, -15, 15, 0],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ 
                      duration: 0.5,
                      delay: 0.6 // Delay to wait for banner fly animation
                    }}
                  >
                    <Bell size={20} />
                    {notifications.some(n => !n.read) && (
                      <span className="unread-badge">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {showNotifPanel && (
                      <motion.div 
                        className="notif-panel"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      >
                        <div className="notif-panel-header">
                          <h4>Notifications</h4>
                          <span className="notif-count">{notifications.length} alerts</span>
                        </div>
                        <div className="notif-list-container">
                          {notifications.length === 0 ? (
                            <div className="notif-empty">
                              <BellOff size={32} opacity={0.2} />
                              <p>No alerts recorded</p>
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className={`notif-hub-item notif-type--${n.type?.toLowerCase()}`}>
                                <div className="notif-hub-icon">
                                  {n.type === 'CRITICAL' ? <AlertTriangle size={16} /> : <Activity size={16} />}
                                </div>
                                <div className="notif-hub-content">
                                  <p>{n.message}</p>
                                  <span className="notif-hub-time">{n.time}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </header>

          {/* ... (Sensor Forecast Cards Section) */}
          <div className="forecast-section">
              
              {/* Group 1: Atmospheric Intelligence (Weather-affected) */}
              <div className="forecast-group">
                <h3 className="section-title">
                  <CloudSun size={18} />
                  Atmospheric Intelligence (Weather-Affected)
                </h3>
                <div className="forecast-grid">
                  {['temp_c', 'humidity_pct'].map((sensor) => {
                    const trend = insightsData?.sensor_trends?.[sensor];
                    if (!trend) return null;
                    const Icon = SENSOR_ICONS[sensor] || Activity;
                    const statusColor = STATUS_COLORS[trend.status] || STATUS_COLORS.STABLE;
                    return (
                      <div key={sensor} className="forecast-card" style={{ borderLeftColor: statusColor }}>
                        <div className="forecast-card-header">
                          <div className="forecast-card-icon" style={{ color: statusColor }}>
                            <Icon size={18} />
                          </div>
                          <span className="forecast-card-name">{SENSOR_LABELS[sensor] || sensor}</span>
                          <span className="forecast-status-badge" style={{ background: statusColor }}>
                            {trend.status}
                          </span>
                        </div>
                        <div className="forecast-card-value">
                          {trend.current} <span className="forecast-card-unit">{trend.unit}</span>
                        </div>
                        <div className="forecast-card-direction">
                          {trend.direction === 'rising' && <TrendingUp size={14} />}
                          {trend.direction === 'falling' && <TrendingDown size={14} />}
                          {trend.direction === 'stable' && <ShieldCheck size={14} />}
                          <span>{trend.direction}</span>
                          <span className="forecast-next-val"> (1h: {trend.predicted_1h})</span>
                        </div>
                        {trend.minutes != null && (
                          <div className="forecast-card-breach">
                            <Clock size={14} />
                            <span>
                              ⏱ ~{trend.minutes >= 60 
                                ? `${Math.floor(trend.minutes / 60)} hr ${trend.minutes % 60} min` 
                                : `${trend.minutes} min`} to limit
                            </span>
                          </div>
                        )}
                        <div className="forecast-card-footer">
                          <span className="forecast-confidence">
                            Prediction Confidence: {trend.confidence}%
                          </span>
                          {trend.automation_response && (
                            <span className="forecast-automation">
                              ⚡ {trend.automation_response}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Nutrient Intelligence (Hydroponic) */}
              <div className="forecast-group">
                <h3 className="section-title">
                  <Droplets size={18} />
                  Nutrient Intelligence (System-Controlled)
                </h3>
                <div className="forecast-grid">
                  {['ph', 'ec_level', 'water_temp_c'].map((sensor) => {
                    const trend = insightsData?.sensor_trends?.[sensor];
                    if (!trend) return null;
                    const Icon = SENSOR_ICONS[sensor] || Activity;
                    const statusColor = STATUS_COLORS[trend.status] || STATUS_COLORS.STABLE;
                    return (
                      <div key={sensor} className="forecast-card" style={{ borderLeftColor: statusColor }}>
                        <div className="forecast-card-header">
                          <div className="forecast-card-icon" style={{ color: statusColor }}>
                            <Icon size={18} />
                          </div>
                          <span className="forecast-card-name">{SENSOR_LABELS[sensor] || sensor}</span>
                          <span className="forecast-status-badge" style={{ background: statusColor }}>
                            {trend.status}
                          </span>
                        </div>
                        <div className="forecast-card-value">
                          {trend.current} <span className="forecast-card-unit">{trend.unit}</span>
                        </div>
                        <div className="forecast-card-direction">
                          {trend.direction === 'rising' && <TrendingUp size={14} />}
                          {trend.direction === 'falling' && <TrendingDown size={14} />}
                          {trend.direction === 'stable' && <ShieldCheck size={14} />}
                          <span>{trend.direction}</span>
                          <span className="forecast-next-val"> (1h: {trend.predicted_1h})</span>
                        </div>
                        {trend.minutes != null && (
                          <div className="forecast-card-breach">
                            <Clock size={14} />
                            <span>
                              ⏱ ~{trend.minutes >= 60 
                                ? `${Math.floor(trend.minutes / 60)} hr ${trend.minutes % 60} min` 
                                : `${trend.minutes} min`} to limit
                            </span>
                          </div>
                        )}
                        <div className="forecast-card-footer">
                          <span className="forecast-confidence">
                            Prediction Confidence: {trend.confidence}%
                          </span>
                          {trend.automation_response && (
                            <span className="forecast-automation">
                              ⚡ {trend.automation_response}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          <div className="climate-grid">
            <SensorTrendChart metricKey="temp" historyData={historyData} />
            <SensorTrendChart metricKey="ec" historyData={historyData} />
            <SensorTrendChart metricKey="humidity" historyData={historyData} />
            <SensorTrendChart metricKey="water_temp" historyData={historyData} />
            <SensorTrendChart metricKey="ph" historyData={historyData} />
          </div>

          {/* ── Section 3: Weather Forecast ─────────────────────────── */}
          <div className="weather-section">
              <h3 className="section-title">
                <CloudRain size={18} />
                24h Weather Forecast — Johor Bahru
              </h3>
              <div className="weather-content">
                <div className="weather-stat-grid">
                  <div className="weather-stat-box">
                    <Thermometer size={22} className="weather-stat-icon" />
                    <span className="weather-stat-label">Max Temperature</span>
                    <span className="weather-stat-value">
                      {forecastData?.forecast_24h?.max_temp_c ?? '--'}°C
                    </span>
                  </div>
                  <div className="weather-stat-box">
                    <CloudSun size={22} className="weather-stat-icon" />
                    <span className="weather-stat-label">Max Humidity</span>
                    <span className="weather-stat-value">
                      {forecastData?.forecast_24h?.max_humidity_pct ?? '--'}%
                    </span>
                  </div>
                  <div className="weather-stat-box">
                    <Sun size={22} className="weather-stat-icon" />
                    <span className="weather-stat-label">Solar Radiation</span>
                    <span className="weather-stat-value">
                      {forecastData?.forecast_24h?.max_solar_w_m2 ?? '--'} W/m²
                    </span>
                  </div>
                  <div className="weather-stat-box">
                    <CloudRain size={22} className="weather-stat-icon" />
                    <span className="weather-stat-label">Rain Probability</span>
                    <span className="weather-stat-value">
                      {forecastData?.forecast_24h?.max_precip_prob ?? '--'}%
                    </span>
                  </div>
                </div>
                {forecastData?.insights?.length > 0 && (
                  <div className="weather-insights-list">
                    <h4>AI Insights</h4>
                    <ul>
                      {forecastData.insights.map((insight, idx) => (
                        <li key={idx}>
                          <AlertTriangle size={14} />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {forecastData?.alerts?.length > 0 && (
                  <div className="weather-tag-container">
                    {forecastData.alerts.map((alert, idx) => (
                      <span key={idx} className="weather-tag">{alert.replace('_', ' ')}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* ── Section 4: Harvest Predictions ──────────────────────── */}
          <div className="harvest-section">
              <h3 className="section-title">
                <Sprout size={18} />
                Harvest Date Predictions
              </h3>
              <div className="harvest-card">
                {insightsData?.harvest?.map((crop, idx) => (
                  <div key={idx} className="harvest-row">
                    <div className="harvest-info">
                      <span className="harvest-crop">{crop.crop}</span>
                      <span className="harvest-zone">{crop.zone}</span>
                    </div>
                    <div className="harvest-health">
                      <span className="harvest-health-label">Health: </span>
                      <span className="harvest-health-value">{crop.health}/100</span>
                    </div>
                    <div className="harvest-days">
                      <Clock size={14} />
                      <span>{crop.days} days left</span>
                    </div>
                    <div className="harvest-progress-wrapper">
                      <div className="harvest-progress-bar">
                        <div 
                          className="harvest-progress-fill" 
                          style={{ width: `${crop.progress}%` }}
                        />
                      </div>
                      <span className="harvest-progress-label">{crop.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
      </div>
    </div>
  );
};

export default Climate;
