import React from 'react';
import { useElectricityContext } from '../../context/ElectricityContext';
import { Zap, Activity, Calendar, DollarSign } from 'lucide-react';

const SummaryMetrics = () => {
  const { summary, budgetW } = useElectricityContext();

  const peakKwh = summary.today_kwh * 0.3;
  const offpeakKwh = summary.today_kwh * 0.7;
  const peakCost = peakKwh * 0.571;
  const offpeakCost = offpeakKwh * 0.244;
  const todayRM = peakCost + offpeakCost;
  const monthRM = summary.today_kwh > 0 ? (summary.month_kwh / summary.today_kwh) * todayRM : 0;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-title"><Activity size={16} style={{display:'inline', marginRight:'4px'}}/> Total Now</div>
        <div className="metric-value">{summary.total_W.toFixed(1)} W</div>
        <div className="metric-subtext">of {budgetW} W budget</div>
      </div>
      <div className="metric-card">
        <div className="metric-title"><Zap size={16} style={{display:'inline', marginRight:'4px'}}/> Today's kWh</div>
        <div className="metric-value">{summary.today_kwh.toFixed(3)} kWh</div>
        <div className="metric-subtext">Est. RM {todayRM.toFixed(2)}</div>
      </div>
      <div className="metric-card">
        <div className="metric-title"><Calendar size={16} style={{display:'inline', marginRight:'4px'}}/> This Month</div>
        <div className="metric-value">{summary.month_kwh.toFixed(2)} kWh</div>
        <div className="metric-subtext">Est. RM {monthRM.toFixed(2)}</div>
      </div>
      <div className="metric-card">
        <div className="metric-title"><DollarSign size={16} style={{display:'inline', marginRight:'4px'}}/> Peak Hour Cost</div>
        <div className="metric-value">RM {peakCost.toFixed(2)}</div>
        <div className="metric-subtext">vs Off-Peak RM {offpeakCost.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default SummaryMetrics;
