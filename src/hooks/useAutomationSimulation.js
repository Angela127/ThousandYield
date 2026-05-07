import { useState, useEffect, useRef } from 'react';

// Helpers
const getStoredTarget = (key, defaultVal) => {
  const stored = localStorage.getItem(`automation_${key}`);
  return stored !== null ? parseFloat(stored) : defaultVal;
};

const setStoredTarget = (key, val) => {
  localStorage.setItem(`automation_${key}`, val);
};

export const useAutomationSimulation = () => {
  // Targets
  const [targetIndoorTemp, setTargetIndoorTempState] = useState(() => getStoredTarget('targetIndoorTemp', 24.0));
  const [targetHumidityMin, setTargetHumidityMinState] = useState(() => getStoredTarget('targetHumidityMin', 60));
  const [targetHumidityMax, setTargetHumidityMaxState] = useState(() => getStoredTarget('targetHumidityMax', 80));
  const [targetPh, setTargetPhState] = useState(() => getStoredTarget('targetPh', 6.2));

  // Wrappers to update state and localStorage
  const setTargetIndoorTemp = (val) => { setTargetIndoorTempState(val); setStoredTarget('targetIndoorTemp', val); };
  const setTargetHumidityMin = (val) => { setTargetHumidityMinState(val); setStoredTarget('targetHumidityMin', val); };
  const setTargetHumidityMax = (val) => { setTargetHumidityMaxState(val); setStoredTarget('targetHumidityMax', val); };
  const setTargetPh = (val) => { setTargetPhState(val); setStoredTarget('targetPh', val); };

  // Simulation State
  const [outdoorTemp, setOutdoorTemp] = useState(30.0);
  const [indoorTemp, setIndoorTemp] = useState(28.0);
  const [acTarget, setAcTarget] = useState(20.0);
  const [acPower, setAcPower] = useState(0);
  
  const [humidity, setHumidity] = useState(70.0);
  const [sprayerStatus, setSprayerStatus] = useState('Standby');
  
  const [waterPh, setWaterPh] = useState(7.0);
  const [reservoir, setReservoir] = useState(80);

  // History & Logs
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => {
      const newLog = { time: new Date().toLocaleTimeString(), msg };
      return [newLog, ...prev].slice(0, 50);
    });
  };

  // Simulation references to avoid stale closures in setInterval
  const stateRef = useRef({
    indoorTemp: 28.0,
    humidity: 70.0,
    waterPh: 7.0,
    reservoir: 80,
    sprayerStatus: 'Standby',
    acOn: false,
    simTime: 0, // Simulated time in seconds
  });

  const targetsRef = useRef({
    targetIndoorTemp,
    targetHumidityMin,
    targetHumidityMax,
    targetPh
  });

  // Keep refs up to date
  useEffect(() => {
    targetsRef.current = { targetIndoorTemp, targetHumidityMin, targetHumidityMax, targetPh };
  }, [targetIndoorTemp, targetHumidityMin, targetHumidityMax, targetPh]);

  // Main Simulation Loop
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      const state = stateRef.current;
      const targets = targetsRef.current;
      const simTickSeconds = 60; // 1 real second = 1 simulated minute
      
      state.simTime += simTickSeconds;
      
      // --- 1. Outdoor Temperature (Sinusoidal, 24h cycle) ---
      // 24h = 86400s. Base 28C, amplitude 6C (peaks at 34C, dips to 22C)
      const currentOutdoorTemp = 28 + 6 * Math.sin((2 * Math.PI * state.simTime) / 86400);
      setOutdoorTemp(Number(currentOutdoorTemp.toFixed(1)));

      // --- 2. Indoor Temperature (PID-like Proportional + Physics) ---
      let currentIndoorTemp = state.indoorTemp;
      const tempError = currentIndoorTemp - targets.targetIndoorTemp;
      let newAcPower = 0;
      let newAcTarget = targets.targetIndoorTemp;

      if (!state.acOn) {
        state.acOn = true; // AC runs continuously in Auto mode
        addLog(`AC System initialized for continuous climate control.`);
      }

      // AC setpoint calculation (Proportional response)
      // If room is too hot (error > 0), AC outputs colder air
      // If room is too cold (error < 0), AC outputs warmer air to save electricity
      newAcTarget = targets.targetIndoorTemp - (tempError * 2);
      
      // Clamp AC output between hardware limits
      newAcTarget = Math.max(16, Math.min(32, newAcTarget));

      // Heat transfer from AC per second * simTickSeconds
      const coolEffect = (0.002 * (newAcTarget - currentIndoorTemp)) * simTickSeconds;
      currentIndoorTemp += coolEffect;

      // Power calculation: scales with effort (temperature delta), minimum 50W for fan
      const tempDelta = Math.abs(newAcTarget - currentIndoorTemp);
      newAcPower = Math.max(50, tempDelta * 150);

      // Heat gain/leak from outdoor per second * simTickSeconds
      const heatLeak = (0.0005 * (currentOutdoorTemp - currentIndoorTemp)) * simTickSeconds;
      currentIndoorTemp += heatLeak;
      
      state.indoorTemp = currentIndoorTemp;
      setIndoorTemp(Number(currentIndoorTemp.toFixed(1)));
      setAcTarget(Number(newAcTarget.toFixed(1)));
      setAcPower(Math.round(newAcPower));

      // --- 3. Humidity (Bang-Bang Control) ---
      let currentHumidity = state.humidity;
      
      if (currentHumidity < targets.targetHumidityMin && state.sprayerStatus !== 'Active') {
        state.sprayerStatus = 'Active';
        addLog(`Sprayer ACTIVATED (Humidity ${currentHumidity.toFixed(1)}% < ${targets.targetHumidityMin}%)`);
      } else if (currentHumidity > targets.targetHumidityMax && state.sprayerStatus === 'Active') {
        state.sprayerStatus = 'Standby';
        addLog(`Sprayer DEACTIVATED (Humidity ${currentHumidity.toFixed(1)}% > ${targets.targetHumidityMax}%)`);
      }

      if (state.sprayerStatus === 'Active') {
        // Increase humidity fast per second * simTickSeconds
        currentHumidity += (0.01 * simTickSeconds);
        // Uses water
        state.reservoir = Math.max(0, state.reservoir - (0.005 * simTickSeconds));
      } else {
        // Natural evaporation/drift towards 50%
        const drift = ((50 - currentHumidity) * 0.0002) * simTickSeconds;
        currentHumidity += drift;
      }
      
      // Clamp humidity
      currentHumidity = Math.max(0, Math.min(100, currentHumidity));
      
      state.humidity = currentHumidity;
      setHumidity(Number(currentHumidity.toFixed(1)));
      setSprayerStatus(state.sprayerStatus);
      setReservoir(Number(state.reservoir.toFixed(1)));

      // --- 4. Water pH (Proportional Dosing) ---
      let currentPh = state.waterPh;
      const phError = currentPh - targets.targetPh;
      
      if (Math.abs(phError) > 0.1) {
        // Dose acid/base
        const dose = (0.001 * phError) * simTickSeconds;
        currentPh -= dose;
        
        // Log occasionally (e.g., if error is large enough, but not every tick)
        if (Math.random() < 0.1) {
           addLog(`Dosing ${phError > 0 ? 'Acid' : 'Base'} to adjust pH ${currentPh.toFixed(2)} -> ${targets.targetPh.toFixed(2)}`);
        }
      } else {
        // Natural drift (minerals) per second * simTickSeconds
        currentPh += (0.0001 * simTickSeconds);
      }

      state.waterPh = currentPh;
      setWaterPh(Number(currentPh.toFixed(2)));

      // --- 5. Update History (keep last 60 points) ---
      setHistory(prev => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second: '2-digit' });
        const newPoint = {
          time: timeStr,
          indoorTemp: Number(state.indoorTemp.toFixed(1)),
          outdoorTemp: Number(currentOutdoorTemp.toFixed(1)),
          humidity: Number(state.humidity.toFixed(1)),
          ph: Number(state.waterPh.toFixed(2))
        };
        return [...prev, newPoint].slice(-60); // 1 minute of real-time ticks
      });

    }, 1000); // 1 real second interval

    return () => clearInterval(intervalId);
  }, [isRunning]);

  return {
    targets: {
      targetIndoorTemp, setTargetIndoorTemp,
      targetHumidityMin, setTargetHumidityMin,
      targetHumidityMax, setTargetHumidityMax,
      targetPh, setTargetPh
    },
    state: {
      outdoorTemp, indoorTemp, acTarget, acPower,
      humidity, sprayerStatus,
      waterPh, reservoir,
      history, logs,
      isRunning, setIsRunning
    }
  };
};
