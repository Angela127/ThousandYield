import { useState, useEffect, useCallback, useRef } from 'react';
import { BASE_WATTS, INITIAL_DEVICE_REGISTRY, TARIFF_RATES, isPeak } from '../constants/electricityConfig';

export const useElectricitySimulator = () => {
  const [deviceRegistry, setDeviceRegistry] = useState(INITIAL_DEVICE_REGISTRY);
  const [budgetW, setBudgetW] = useState(6000);
  const [budgetStatus, setBudgetStatus] = useState('ok');
  const [suggestions, setSuggestions] = useState([]);
  
  const [summary, setSummary] = useState({
    total_W: 0,
    today_kwh: 0,
    month_kwh: 0
  });

  const deviceTimers = useRef({});
  const lastTickTime = useRef(Date.now());

  const updateDevice = useCallback((id, patch) => {
    setDeviceRegistry(prev => ({
      ...prev,
      [id]: { ...prev[id], ...patch }
    }));
  }, []);

  const updateBudget = useCallback((newBudget) => {
    setBudgetW(newBudget);
  }, []);

  const acknowledgeAlert = useCallback((id) => {
    if (deviceTimers.current[id]) {
      clearTimeout(deviceTimers.current[id]);
      delete deviceTimers.current[id];
    }
    setDeviceRegistry(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        alert: null,
        countdownStartedAt: null,
        status: prev[id].status === 'breached' ? 'warning' : prev[id].status // keep it running, clear breach state to avoid re-triggering immediately
      }
    }));
  }, []);

  const applySuggestion = useCallback((suggestion) => {
    if (suggestion.action === 'apply_shift') {
      updateDevice(suggestion.deviceId, { preferred_run_time: suggestion.targetTime, shifted: true });
    } else if (suggestion.action === 'apply_cap') {
      updateDevice(suggestion.deviceId, { cap_enabled: true });
    } else if (suggestion.action === 'enable_auto_cut') {
      updateDevice(suggestion.deviceId, { auto_cut_at_90: true });
    }
    // Optimistically remove suggestion
    setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, applied: true } : s));
  }, [updateDevice]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceRegistry(currentRegistry => {
        const nextRegistry = { ...currentRegistry };
        const now = Date.now();
        lastTickTime.current = now;

        const currentHour = new Date().getHours();
        const peak = isPeak(currentHour);

        // Simulator update watts
        Object.keys(nextRegistry).forEach(id => {
          const device = { ...nextRegistry[id] };
          if (device.status === 'off') {
            device.watts_live = 0;
          } else {
            let base = BASE_WATTS[id];
            
            // 4. For lighting devices: occasionally spike to 420W to trigger breach demo
            if (device.groupId === 'lighting' && Math.random() < 0.10) {
               base = 420;
            }
            
            // 2. watts_live = BASE_WATTS[id] * (1 + (Math.random() - 0.5) * 0.10)
            let simulatedWatts = base * (1 + (Math.random() - 0.5) * 0.10);
            
            // 5. If peak_cap_watts is set AND current time is peak hours: cap watts_live if enabled
            if (peak && device.peak_cap_watts !== null && device.cap_enabled) {
               if (simulatedWatts > device.peak_cap_watts) {
                   simulatedWatts = device.peak_cap_watts;
               }
            }

            device.watts_live = Number(simulatedWatts.toFixed(1));
          }
          nextRegistry[id] = device;
        });

        // Engine 1: Per-Device Threshold Engine
        Object.keys(nextRegistry).forEach(id => {
          const device = nextRegistry[id];
          if (device.priority === 'critical') {
            // Never auto-cut. Just alert.
             const pct = (device.watts_live / device.watts_threshold) * 100;
             if (pct >= 100) {
                 device.alert = { type: "breach", message: `${device.name} exceeded limit (CRITICAL)` };
             } else if (pct >= 80) {
                 device.alert = { type: "warning", message: `${device.name} at ${pct.toFixed(0)}%` };
             } else {
                 device.alert = null;
             }
             return;
          }

          if (device.status === 'off') return;

          const pct = (device.watts_live / device.watts_threshold) * 100;

          if (pct < 80) {
             if (device.status !== 'on') device.status = "on";
             if (device.alert && device.alert.type !== 'info') device.alert = null;
             
             if (deviceTimers.current[id]) {
               clearTimeout(deviceTimers.current[id]);
               delete deviceTimers.current[id];
             }
             device.countdownStartedAt = null;
          } else if (pct >= 80 && pct < 100) {
             if (device.status !== 'warning') device.status = "warning";
             device.alert = { type: "warning", message: `${device.name} at ${pct.toFixed(0)}% of limit` };
          } else if (pct >= 100) {
             if (device.status !== 'breached') device.status = "breached";
             device.alert = { type: "breach", message: `${device.name} exceeded limit` };
             
             const timeoutMs = device.priority === 'high' ? 60000 : (device.priority === 'medium' ? 30000 : 0);
             
             if (device.priority === 'low') {
               device.status = "off";
               device.watts_live = 0;
               device.alert = { type: "info", message: `${device.name} auto-cut due to low priority breach` };
             } else if (!deviceTimers.current[id] && !device.countdownStartedAt) {
               device.countdownStartedAt = Date.now();
               device.countdownDuration = timeoutMs;
               deviceTimers.current[id] = setTimeout(() => {
                 setDeviceRegistry(latestReg => {
                   const updated = { ...latestReg };
                   if (updated[id] && updated[id].status === 'breached') {
                      if (updated[id].priority === 'high') {
                         updated[id].watts_threshold = Number((updated[id].watts_threshold * 0.9).toFixed(1));
                         updated[id].alert = { type: "info", message: `${updated[id].name} dimmed to 90%` };
                      } else if (updated[id].priority === 'medium') {
                         updated[id].status = "off";
                         updated[id].watts_live = 0;
                         updated[id].alert = { type: "info", message: `${updated[id].name} turned off automatically` };
                      }
                   }
                   return updated;
                 });
                 delete deviceTimers.current[id];
               }, timeoutMs);
             }
          }
        });

        // Engine 2: Total Budget Cap Engine
        let final_total_W = Object.values(nextRegistry).reduce((sum, dev) => sum + dev.watts_live, 0);
        let budget_pct = (final_total_W / budgetW) * 100;
        let bStatus = "ok";

        if (budget_pct >= 90) {
           bStatus = "critical";
           Object.keys(nextRegistry).forEach(id => {
             const device = nextRegistry[id];
             if (device.priority === 'critical') return; 
             
             if (device.priority === 'low' && device.status !== 'off') {
               device.status = "off";
               device.watts_live = 0;
               device.alert = { type: 'info', message: `${device.name} auto-cut due to critical budget` };
             }
             if (device.auto_cut_at_90 && device.status !== 'off') {
               device.status = 'off';
               device.watts_live = 0;
               device.alert = { type: 'info', message: `${device.name} auto-cut to protect budget` };
             }
           });
           
           final_total_W = Object.values(nextRegistry).reduce((sum, dev) => sum + dev.watts_live, 0);
           budget_pct = (final_total_W / budgetW) * 100;
        } else if (budget_pct >= 80) {
           bStatus = "warning";
        }
        
        setBudgetStatus(bStatus);
        
        setSummary(prev => ({
          total_W: Number(final_total_W.toFixed(1)),
          today_kwh: prev.today_kwh + (final_total_W * (5/3600) / 1000),
          month_kwh: prev.month_kwh + (final_total_W * (5/3600) / 1000)
        }));

        // Engine 3: Optimisation Engine
        setSuggestions(prevSuggestions => {
          const newSuggestions = [...prevSuggestions];
          Object.keys(nextRegistry).forEach(id => {
            const device = nextRegistry[id];
            
            if (device.schedulable && device.status === 'on' && peak && !device.shifted && device.preferred_run_time) {
              const sugId = `shift_${id}`;
              if (!newSuggestions.find(s => s.id === sugId)) {
                newSuggestions.push({
                  id: sugId,
                  deviceId: id,
                  type: "shift",
                  title: `Shift ${device.name} to off-peak`,
                  description: `Move run-time to ${device.preferred_run_time}`,
                  savings_per_day: ((device.watts_live * 4 * (TARIFF_RATES.peak_rate - TARIFF_RATES.offpeak_rate)) / 1000).toFixed(2),
                  action: "apply_shift",
                  targetTime: device.preferred_run_time
                });
              }
            }
            if (device.peak_cap_watts && device.status === 'on' && !device.cap_enabled && peak) {
               const sugId = `cap_${id}`;
               if (!newSuggestions.find(s => s.id === sugId)) {
                 newSuggestions.push({
                   id: sugId,
                   deviceId: id,
                   type: "cap",
                   title: `Cap ${device.name} during peak hours`,
                   description: `Limit usage to ${device.peak_cap_watts}W`,
                   savings_per_day: (((device.watts_live - device.peak_cap_watts) * 8 * TARIFF_RATES.peak_rate) / 1000).toFixed(2),
                   action: "apply_cap",
                   capWatts: device.peak_cap_watts
                 });
               }
            }
          });
          
          if (budget_pct > 80) {
             const sortedDevices = Object.keys(nextRegistry)
                .map(id => ({ id, ...nextRegistry[id] }))
                .filter(d => (d.priority === 'low' || d.priority === 'medium') && !d.auto_cut_at_90 && d.status === 'on')
                .sort((a, b) => b.watts_live - a.watts_live);
                
             if (sortedDevices.length > 0) {
               const device = sortedDevices[0];
               const sugId = `cut_${device.id}`;
               if (!newSuggestions.find(s => s.id === sugId)) {
                 newSuggestions.push({
                   id: sugId,
                   deviceId: device.id,
                   type: "cut",
                   title: `Suspend ${device.name} when budget > 90%`,
                   description: `Automatically cut off when budget is critical.`,
                   savings_per_day: ((device.watts_live * 2 * TARIFF_RATES.peak_rate) / 1000).toFixed(2),
                   action: "enable_auto_cut"
                 });
               }
             }
          }
          return newSuggestions;
        });

        return nextRegistry;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [budgetW]);

  return {
    deviceRegistry,
    budgetW,
    budgetStatus,
    summary,
    suggestions,
    updateDevice,
    updateBudget,
    acknowledgeAlert,
    applySuggestion
  };
};
