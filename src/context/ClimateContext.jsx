import React, { createContext, useContext, useState, useEffect } from 'react';

const ClimateContext = createContext(null);

const INTELLIGENCE_API = 'http://localhost:5001';

export const ClimateProvider = ({ children }) => {
  const [insightsData, setInsightsData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeAnomaly, setActiveAnomaly] = useState(localStorage.getItem('simulation_anomaly') || 'none');

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
      } catch (err) {
        // Silently fail — do not break the dashboard
        console.error("Failed to fetch climate data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [activeAnomaly]);

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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <ClimateContext.Provider value={{ insightsData, forecastData, historyData, notifications, lastUpdated, markAllAsRead, setNotifications }}>
      {children}
    </ClimateContext.Provider>
  );
};

export const useClimateContext = () => {
  const context = useContext(ClimateContext);
  if (!context) {
    throw new Error('useClimateContext must be used within a ClimateProvider');
  }
  return context;
};
