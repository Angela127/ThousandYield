import React, { useState, useEffect } from 'react';
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

const Climate = () => {
  const [insightsData, setInsightsData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [insightsRes, forecastRes, historyRes] = await Promise.all([
          fetch(`${INTELLIGENCE_API}/api/insights`).catch(() => null),
          fetch(`${INTELLIGENCE_API}/api/forecast`).catch(() => null),
          fetch(`${INTELLIGENCE_API}/api/history?limit=24`).catch(() => null),
        ]);

        if (insightsRes && insightsRes.ok) {
          const iData = await insightsRes.json();
          setInsightsData(iData);
        }

        if (forecastRes && forecastRes.ok) {
          const fData = await forecastRes.json();
          setForecastData(fData);
        }

        if (historyRes && historyRes.ok) {
          const hData = await historyRes.json();
          setHistoryData(hData.history || []);
        }

        setLastUpdated(new Date().toLocaleTimeString());
      } catch {
        // Silently fail — do not break the dashboard
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

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
          {showBanner && (
            <div className={`forecast-banner forecast-banner--${insightsData?.overall_status?.toLowerCase() || 'stable'}`}>
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
            </div>
          )}

          {/* ... (Header Section) */}
          <header className="view-header">
            <div className="header-title-row">
              <div>
                <h1>Environment Intelligence</h1>
                <p>Predictive analytics for atmospheric and hydroponic systems.</p>
              </div>
              {lastUpdated && (
                <div className="last-updated-badge">
                  <Clock size={14} />
                  <span>Last updated: {lastUpdated}</span>
                </div>
              )}
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
            <div className="main-chart-card">
              <h3>Environmental Trends (Last 24 Readings)</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      interval={2} 
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[0, 100]}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#A3B18A" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[500, 2000]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)', 
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      iconType="circle" 
                      iconSize={10}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 500, paddingTop: '15px' }}
                    />
                    
                    {/* Reference Lines (Optimal Zones) */}
                    <ReferenceLine yAxisId="left" y={22} label={{ position: 'right', value: 'Ideal Temp', fill: '#FF5722', fontSize: 10 }} stroke="#FF5722" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine yAxisId="left" y={6.0} label={{ position: 'right', value: 'Ideal pH', fill: '#4CAF50', fontSize: 10 }} stroke="#4CAF50" strokeDasharray="3 3" strokeOpacity={0.5} />

                    {/* Sensor Lines */}
                    <Line yAxisId="left" type="monotone" dataKey="temp" name="Air Temp (°C)" stroke="#FF5722" strokeWidth={3} dot={false} animationDuration={1500} />
                    <Line yAxisId="left" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#2196F3" strokeWidth={3} dot={false} animationDuration={1500} />
                    <Line yAxisId="left" type="monotone" dataKey="ph" name="pH Level" stroke="#4CAF50" strokeWidth={4} dot={false} animationDuration={1500} />
                    <Line yAxisId="left" type="monotone" dataKey="water_temp" name="Water Temp (°C)" stroke="#00BCD4" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <Line yAxisId="right" type="monotone" dataKey="ec" name="EC Level (µS/cm)" stroke="#3A5A40" strokeWidth={3} dot={false} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
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
