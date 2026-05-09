import { useState, useEffect, useCallback, useRef } from 'react';

const INITIAL_ZONES = [
  { id: 'zone_a', name: 'Zone A', crop: 'Lettuce', growthStage: 'vegetative', moisture: 58, minMoisture: 45, status: 'ok', pumpActive: false, usageStats: { todayL: 14.5, weekL: 85, monthL: 320, avgSessionL: 5.2 } },
  { id: 'zone_b', name: 'Zone B', crop: 'Tomatoes', growthStage: 'flowering', moisture: 72, minMoisture: 60, status: 'ok', pumpActive: false, usageStats: { todayL: 22.0, weekL: 140, monthL: 580, avgSessionL: 8.5 } },
  { id: 'zone_c', name: 'Zone C', crop: 'Herbs', growthStage: 'harvest-ready', moisture: 42, minMoisture: 40, status: 'warning', pumpActive: false, usageStats: { todayL: 8.2, weekL: 55, monthL: 210, avgSessionL: 3.1 } },
  { id: 'zone_d', name: 'Zone D', crop: 'Strawberries', growthStage: 'vegetative', moisture: 65, minMoisture: 50, status: 'ok', pumpActive: false, usageStats: { todayL: 18.5, weekL: 110, monthL: 450, avgSessionL: 6.8 } },
  { id: 'zone_e', name: 'Zone E', crop: 'Peppers', growthStage: 'seedling', moisture: 55, minMoisture: 40, status: 'ok', pumpActive: false, usageStats: { todayL: 10.0, weekL: 65, monthL: 260, avgSessionL: 4.0 } },
  { id: 'zone_f', name: 'Zone F', crop: 'Cucumbers', growthStage: 'flowering', moisture: 80, minMoisture: 65, status: 'ok', pumpActive: false, usageStats: { todayL: 25.5, weekL: 165, monthL: 680, avgSessionL: 10.2 } }
];

const INITIAL_SCHEDULES = [
  { id: 'sch_1', zoneId: 'zone_a', time: '06:00', durationMinutes: 15, enabled: true },
  { id: 'sch_2', zoneId: 'zone_b', time: '08:00', durationMinutes: 10, enabled: true },
  { id: 'sch_3', zoneId: 'zone_c', time: '18:00', durationMinutes: 5, enabled: true },
];

export const useIrrigationSimulator = () => {
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [reservoir, setReservoir] = useState({ volumeL: 4200, maxVolumeL: 5000, pH: 6.2 });
  const [pump, setPump] = useState({ status: 'idle', flowRateLpm: 0 }); // flowRate L/min
  const [alerts, setAlerts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);

  const [usageStats, setUsageStats] = useState({
    todayL: 145,
    weekL: 840,
    monthL: 3200
  });

  const lastTickTime = useRef(Date.now());
  const manualOverrides = useRef({}); // { zoneId: endTime }

  const triggerManualRun = useCallback((zoneId, durationMinutes = 5) => {
    manualOverrides.current[zoneId] = Date.now() + (durationMinutes * 60000);
    // Update zone status immediately to reflect manual run
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, pumpActive: true, status: 'running' } : z));
  }, []);

  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const dismissSuggestion = useCallback((sugId) => {
    setSuggestions(prev => prev.filter(s => s.id !== sugId));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickTime.current) / 1000; // seconds since last tick
      lastTickTime.current = now;

      setReservoir(prevRes => {
        let nextRes = { ...prevRes };

        // Random pH drift
        if (Math.random() < 0.1) {
          nextRes.pH += (Math.random() - 0.5) * 0.05;
        }

        // Auto-dosing simulation
        if (nextRes.pH < 5.5) {
          nextRes.pH += 0.2; // Dose Base
        } else if (nextRes.pH > 6.5) {
          nextRes.pH -= 0.2; // Dose Acid
        }

        nextRes.pH = Number(nextRes.pH.toFixed(2));
        return nextRes;
      });

      setZones(prevZones => {
        let totalFlowRequest = 0;
        let anyPumpActive = false;

        const nextZones = prevZones.map(zone => {
          let nextZone = { ...zone };

          // Natural moisture depletion
          nextZone.moisture -= (Math.random() * 0.05);

          // Determine if pump should be running for this zone
          let shouldRun = false;

          // 1. Check manual override
          if (manualOverrides.current[zone.id] && now < manualOverrides.current[zone.id]) {
            shouldRun = true;
          } else if (manualOverrides.current[zone.id]) {
            delete manualOverrides.current[zone.id]; // Expired
          }

          // 2. Check threshold automation
          if (!shouldRun && nextZone.moisture <= nextZone.minMoisture - 2) { // 2% buffer to avoid flickering
            shouldRun = true;
            // Let it run until moisture recovers to minMoisture + 10%
          } else if (nextZone.pumpActive && nextZone.moisture < nextZone.minMoisture + 10 && !manualOverrides.current[zone.id]) {
            shouldRun = true; // keep running until recovered
          }

          if (shouldRun) {
            nextZone.pumpActive = true;
            nextZone.status = 'running';
            nextZone.moisture += 0.5; // pump fills moisture fast
            totalFlowRequest += 10; // 10 L/min per active zone
            anyPumpActive = true;
          } else {
            nextZone.pumpActive = false;
            nextZone.status = nextZone.moisture < nextZone.minMoisture + 5 ? 'warning' : 'ok';
          }

          nextZone.moisture = Math.max(0, Math.min(100, Number(nextZone.moisture.toFixed(1))));
          return nextZone;
        });

        // Update Pump state based on zones
        setPump(prevPump => {
          // Check lockout
          setReservoir(currentRes => {
            if (currentRes.volumeL <= 100) {
              if (prevPump.status !== 'lockout') {
                setAlerts(a => {
                  if (!a.find(x => x.type === 'lockout')) {
                    return [...a, { id: Date.now().toString(), type: 'lockout', message: 'CRITICAL: Reservoir low. Pumps locked out to prevent dry run.', severity: 'danger' }];
                  }
                  return a;
                });
              }
              return currentRes;
            }
            return currentRes;
          });

          // Hacky way to check reservoir state inside this setState chain safely.
          // Better approach is to resolve dependencies top-down.
          return {
            status: totalFlowRequest > 0 ? 'running' : 'idle',
            flowRateLpm: totalFlowRequest
          };
        });

        // Drain reservoir and log usage
        if (totalFlowRequest > 0) {
          setReservoir(r => {
            const usageL = (totalFlowRequest / 60) * dt;
            return { ...r, volumeL: Math.max(0, r.volumeL - usageL) };
          });
          setUsageStats(s => {
            const usageL = (totalFlowRequest / 60) * dt;
            return {
              ...s,
              todayL: s.todayL + usageL,
              weekL: s.weekL + usageL,
              monthL: s.monthL + usageL
            }
          });
        }

        return nextZones;
      });

      // Update alerts based on pH
      setReservoir(r => {
        if (r.pH < 5.5 || r.pH > 6.5) {
          setAlerts(a => {
            if (!a.find(x => x.type === 'ph')) {
              return [...a, { id: 'ph_alert', type: 'ph', message: `pH level (${r.pH}) outside safe range (5.5-6.5). Auto-doser engaging.`, severity: 'warning' }];
            }
            return a;
          });
        } else {
          setAlerts(a => a.filter(x => x.type !== 'ph'));
        }
        return r;
      });

      // Optimisation Logic
      const currentHour = new Date().getHours();
      const isPeak = currentHour >= 14 && currentHour < 20;

      if (isPeak && pump.status === 'running') {
        setSuggestions(s => {
          if (!s.find(x => x.id === 'offpeak')) {
            return [...s, { id: 'offpeak', type: 'shift', title: 'Shift Irrigation Off-Peak', desc: 'Running pumps during peak hours increases costs. Shift schedules to before 2 PM or after 8 PM.', savings: '$2.50/day' }];
          }
          return s;
        });
      }

    }, 2000); // Simulate every 2s

    return () => clearInterval(interval);
  }, [pump.status, schedules]);

  const updateSchedule = useCallback((id, updates) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteSchedule = useCallback((id) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  const addSchedule = useCallback((newSchedule) => {
    const id = `sch_${Date.now()}`;
    setSchedules(prev => [...prev, { ...newSchedule, id, enabled: true }]);
  }, []);

  return {
    zones,
    reservoir,
    pump,
    alerts,
    suggestions,
    schedules,
    usageStats,
    triggerManualRun,
    acknowledgeAlert,
    dismissSuggestion,
    updateSchedule,
    deleteSchedule,
    addSchedule
  };
};
