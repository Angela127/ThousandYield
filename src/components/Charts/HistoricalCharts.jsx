import React, { useEffect, useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import historicalData from '../../data/historical_24h.json';
import { db } from '../../firebase-config.js';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import './HistoricalCharts.css';

const buildChartData = (records) => records.map((record) => {
  const timestamp = new Date(record.room_data.timestamp);
  return {
    time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: record.room_data.ambient_sensors?.temp ?? null,
    humidity: record.room_data.ambient_sensors?.humidity ?? null,
    fullTime: timestamp.toLocaleString()
  };
});

const HistoricalCharts = () => {
  const [chartData, setChartData] = useState(() => buildChartData(historicalData));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "telemetry"),
      orderBy("room_data.timestamp", "asc"),
      limit(288)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        const record = doc.data();
        const timestamp = new Date(record.room_data.timestamp);
        
        data.push({
          time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: record.room_data.ambient_sensors.temp,
          humidity: record.room_data.ambient_sensors.humidity,
          fullTime: timestamp.toLocaleString()
        });
      });
      if (data.length > 0) {
        setChartData(data);
      }
      setLoading(false);
    }, (error) => {
      console.error('HistoricalCharts Firestore error:', error);
      setChartData(buildChartData(historicalData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading-placeholder">Loading live telemetry...</div>;

  return (
    <div className="charts-grid">
      {/* Temperature Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>Temperature Trends (°C)</h3>
          <div className="current-value">
            Latest: {chartData[chartData.length - 1]?.temp != null ? chartData[chartData.length - 1].temp.toFixed(1) : '--'}°C
          </div>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#76A34A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#76A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
              <XAxis 
                dataKey="time" 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                interval={24} // Show labels every 2 hours to avoid crowding
              />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip 
                labelStyle={{ color: '#333', fontWeight: 'bold' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                }} 
              />
              <Area 
                type="basis" 
                dataKey="temp" 
                stroke="#76A34A" 
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fillOpacity={1} 
                fill="url(#colorTemp)" 
                animationDuration={2500}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Humidity Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>Ambient Humidity (%)</h3>
          <div className="current-value">
            Latest: {chartData[chartData.length - 1]?.humidity != null ? chartData[chartData.length - 1].humidity.toFixed(1) : '--'}%
          </div>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4E157" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D4E157" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
              <XAxis 
                dataKey="time" 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                interval={24}
              />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                }} 
              />
              <Area 
                type="basis" 
                dataKey="humidity" 
                stroke="#D4E157" 
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fillOpacity={1} 
                fill="url(#colorHum)" 
                animationDuration={2500}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HistoricalCharts;
