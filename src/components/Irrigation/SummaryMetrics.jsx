import React from 'react';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { Waves, FlaskConical, Droplets, Activity } from 'lucide-react';
import StatCard from '../StatCard/StatCard';



const SummaryMetrics = () => {
  const { reservoir, zones, pump } = useIrrigationContext();

  const reservoirPct = Math.round((reservoir.volumeL / reservoir.maxVolumeL) * 100);
  const estDays = Math.round(reservoir.volumeL / 145); // simplistic estimate based on ~145L/day average
  
  const avgMoisture = Math.round(zones.reduce((sum, z) => sum + z.moisture, 0) / zones.length);

  return (
    <div className="irrigation-metrics-grid">
      <StatCard 
        icon={Waves} 
        label="Reservoir Level" 
        value={reservoirPct} 
        unit="%" 
        subtext={`${reservoir.volumeL}L • ~${estDays} days left`}
        status={reservoirPct < 20 ? 'danger' : 'optimal'} 
      />
      <StatCard 
        icon={FlaskConical} 
        label="Water pH" 
        value={reservoir.pH} 
        unit="pH" 
        subtext={reservoir.pH < 5.5 || reservoir.pH > 6.5 ? 'Auto-dosing active' : 'Safe Range: 5.5-6.5'}
        status={reservoir.pH < 5.5 || reservoir.pH > 6.5 ? 'warning' : 'optimal'} 
      />
      <StatCard 
        icon={Droplets} 
        label="Avg Soil Moisture" 
        value={avgMoisture} 
        unit="%" 
        subtext={`${zones.filter(z => z.status === 'warning').length} zones need water`}
        status={avgMoisture < 45 ? 'warning' : 'optimal'} 
      />
      <StatCard 
        icon={Activity} 
        label="Pump Flow Rate" 
        value={pump.flowRateLpm} 
        unit="L/min" 
        subtext={pump.status === 'lockout' ? 'System Locked' : `Status: ${pump.status}`}
        status={pump.status === 'lockout' ? 'danger' : (pump.status === 'running' ? 'active' : 'optimal')} 
      />
    </div>
  );
};

export default SummaryMetrics;
