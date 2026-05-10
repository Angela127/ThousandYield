import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader } from 'lucide-react';
import { useClimateContext } from '../../context/ClimateContext';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { useElectricityContext } from '../../context/ElectricityContext';
import sampleRecord from '../../data/sample_record.json';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAutomationSimulation } from '../../hooks/useAutomationSimulation';
import { motion, AnimatePresence } from 'framer-motion';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your AI Farm Assistant. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fallback to empty objects if context is not available
  const climateContext = useClimateContext() || {};
  const irrigationContext = useIrrigationContext() || {};
  const electricityContext = useElectricityContext() || {};
  
  const { forecastData } = climateContext;

  const [latestData, setLatestData] = useState(sampleRecord);

  useEffect(() => {
    const q = query(
      collection(db, "telemetry"),
      orderBy("room_data.timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        setLatestData(doc.data());
      });
    }, (error) => {
      console.error('Chatbot Firestore error:', error);
    });

    return () => unsubscribe();
  }, []);

  const { state: autoState } = useAutomationSimulation() || { state: {} };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Extract Rack Detail Data
    const racks = latestData.room_data?.racks || [];
    const avgRack = racks[0] || {};
    const sensors = avgRack.rack_sensors || {};
    const controllers = avgRack.rack_controllers || {};
    const plants = avgRack.plants || [];
    const avgHealth = plants.reduce((acc, p) => acc + (p.health_score || 0), 0) / (plants.length || 1);
    const avgLAI = plants.reduce((acc, p) => acc + (p.lai_val || 0), 0) / (plants.length || 1);

    // Calculate electricity breakdown matching the 6 UI cards
    const elecRegistry = electricityContext.deviceRegistry || {};
    const breakdown = {};
    
    // Initialize all groups to ensure they appear even if 0
    const groups = ['lighting', 'climate', 'fans', 'pumps', 'sprayers', 'system'];
    groups.forEach(g => breakdown[g] = { watts: 0, count: 0, total: 0 });

    Object.values(elecRegistry).forEach(d => {
      const group = d.groupId;
      if (groups.includes(group)) {
        breakdown[group].total += 1;
        if (d.status !== 'off') {
          breakdown[group].watts += d.watts_live || 0;
          breakdown[group].count += 1;
        }
      }
    });

    const contextStr = `
Current Farm Status Snapshot (${new Date().toLocaleTimeString()}):

[DASHBOARD]
- Temperature: ${latestData.room_data?.ambient_sensors?.temp || 21.2}°C
- Ambient Humidity: ${latestData.room_data?.ambient_sensors?.humidity || 66.5}%
- Electricity Used Today: ${electricityContext.summary?.today_kwh.toFixed(2) || '22.4'} kWh
- Total Cumulative Water: ${latestData.room_data?.resource_trackers?.total_water_litres || 806.50} L
- Total Cumulative Fertilizer: ${latestData.room_data?.resource_trackers?.total_fertilizer_ml || 2124.60} ml
- Total Cumulative Pesticide: ${latestData.room_data?.resource_trackers?.total_pesticide_ml || 150.00} ml
- System Actuators: ACs (${latestData.room_data?.global_actuators?.ac_units?.filter(u => u.status === 'ON').length || 2} ON), Fans (${latestData.room_data?.global_actuators?.fan_units?.filter(u => u.status === 'ON').length || 2} ON)
- Rack Deployment: ${racks.length} Racks Active

[RACK DETAIL]
- Racks Overview:
${racks.map(r => {
  const rs = r.rack_sensors || {};
  const pls = r.plants || [];
  const avgH = pls.reduce((acc, p) => acc + (p.health_score || 0), 0) / (pls.length || 1);
  const anomalies = pls.filter(p => p.ai_detected_anomaly && p.ai_detected_anomaly !== 'None').map(p => `${p.plant_id}(${p.ai_detected_anomaly})`);
  return `  * ${r.rack_id.replace('rack_', 'Rack ')}: pH: ${rs.ph?.toFixed(1) || '6.2'}, EC: ${rs.ec_mscmn?.toFixed(1) || '1.6'}, Health: ${avgH.toFixed(0)}%, Anomalies: ${anomalies.length > 0 ? anomalies.join(', ') : 'None'}`;
}).join('\n') || '  * No racks data available'}

[IRRIGATION]
- Reservoir Level: ${irrigationContext.reservoir ? Math.round((irrigationContext.reservoir.volumeL / irrigationContext.reservoir.maxVolumeL) * 100) : 85}%
- Water pH: ${irrigationContext.reservoir?.pH || 6.2}
- Average Soil Moisture: ${irrigationContext.zones ? Math.round(irrigationContext.zones.reduce((acc, z) => acc + z.moisture, 0) / irrigationContext.zones.length) : 45}%
- Pump Flow Rate: ${irrigationContext.pump?.flowRateLpm || 0} L/min
- Growth Zones:
${irrigationContext.zones?.map(z => {
  return `  * ${z.name} (${z.crop}): Moisture: ${z.moisture}%, Water Used Today: ${z.usageStats?.todayL?.toFixed(1) || '0'} L, Stage: ${z.growthStage}`;
}).join('\n') || '  * No zones data available'}
- Irrigation Schedule: ${irrigationContext.schedules?.length || 3} active schedules

[ELECTRICITY]
- Usage: Total Now (${electricityContext.summary?.total_W?.toFixed(0) || 0} W), Today (${electricityContext.summary?.today_kwh.toFixed(2) || 0} kWh), This Month (${electricityContext.summary?.month_kwh.toFixed(2) || 0} kWh)
- Total Power Budget: ${electricityContext.budgetW || 6000} W (Status: ${electricityContext.budgetStatus || 'ok'})
- Power Breakdown:
  * LED Lighting: ${breakdown['lighting'].watts.toFixed(0)} W (${breakdown['lighting'].count}/${breakdown['lighting'].total} devices active)
  * Climate Control: ${breakdown['climate'].watts.toFixed(0)} W (${breakdown['climate'].count}/${breakdown['climate'].total} devices active)
  * Ventilation Fans: ${breakdown['fans'].watts.toFixed(0)} W (${breakdown['fans'].count}/${breakdown['fans'].total} devices active)
  * Water Pumps: ${breakdown['pumps'].watts.toFixed(0)} W (${breakdown['pumps'].count}/${breakdown['pumps'].total} devices active)
  * Mist Sprayers: ${breakdown['sprayers'].watts.toFixed(0)} W (${breakdown['sprayers'].count}/${breakdown['sprayers'].total} devices active)
  * System Infrastructure: ${breakdown['system'].watts.toFixed(0)} W (${breakdown['system'].count}/${breakdown['system'].total} devices active)

[AUTOMATION]
- Outdoor Temperature: ${autoState.outdoorTemp || '31.0'}°C
- AC Power: ${autoState.acPower || '1500'} W
- Humidity Inside Farm: ${autoState.humidity || '66.5'}%
- Status of Sprayer: ${autoState.sprayerStatus || 'OFF'}
- Water pH Level: ${autoState.waterPh || '6.2'}

[ENVIRONMENT]
- 24h Weather Forecast: Johor Bahru
  * Max Temperature: ${forecastData?.max_temp || '32'}°C
  * Max Humidity: ${forecastData?.max_humidity || '97'}%
  * Solar Radiation: ${forecastData?.solar_radiation || '739'} W/m²
  * Rain Probability: ${forecastData?.rain_probability || '80'}%
- AI Insights:
  * ${forecastData?.insights?.[0] || 'Humidity forecast to reach 97% — pre-activate exhaust fans tonight to prevent mold.'}
  * ${forecastData?.insights?.[1] || 'External temperature expected to hit 32.0°C — increase cooling system power to protect crops.'}
  * ${forecastData?.insights?.[2] || 'Rain probability reaches 80% — close external vents to prevent water ingress.'}
    `.trim();

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          context: contextStr
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I failed to connect to the backend. Please make sure the API is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (text) => {
    return text.split('\n').map((line, i) => (
      <div key={i} style={{ minHeight: '1em' }}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </div>
    ));
  };

  return (
    <>
      {/* Floating Button */}
      <div className="chatbot-bubble" onClick={() => setIsOpen(!isOpen)}>
        <MessageSquare size={24} color="white" />
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="chatbot-header">
              <div className="chatbot-title">
                <Bot size={20} />
                <h3>Farm Assistant</h3>
              </div>
              <button className="chatbot-close" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.role}`}>
                  <div className="message-icon">
                    {msg.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className="message-text">
                    {renderMessage(msg.text)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-wrapper bot">
                  <div className="message-icon">
                    <Bot size={14} />
                  </div>
                  <div className="message-text loading">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chatbot-input">
              <input
                type="text"
                placeholder="Ask about your farm..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} disabled={isLoading || !inputText.trim()}>
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
