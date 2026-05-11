import React from 'react';
import { useElectricityContext } from '../../context/ElectricityContext';
import { Zap, Activity, Calendar, DollarSign } from 'lucide-react';
import StatCard from '../StatCard/StatCard';

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
      <StatCard
        icon={Activity}
        label="Total Now"
        value={summary.total_W.toFixed(1)}
        unit="W"
        status={summary.total_W > budgetW ? "warning" : "optimal"}
        subtext={`of ${budgetW} W budget`}
      />
      <StatCard
        icon={Zap}
        label="Today's kWh"
        value={summary.today_kwh.toFixed(3)}
        unit="kWh"
        status="optimal"
        subtext={`Est. RM ${todayRM.toFixed(2)}`}
      />
      <StatCard
        icon={Calendar}
        label="This Month"
        value={summary.month_kwh.toFixed(2)}
        unit="kWh"
        status="optimal"
        subtext={`Est. RM ${monthRM.toFixed(2)}`}
      />
      <StatCard
        icon={DollarSign}
        label="Peak Hour Cost"
        value={`RM ${peakCost.toFixed(2)}`}
        unit=""
        status="warning"
        subtext={`vs Off-Peak RM ${offpeakCost.toFixed(2)}`}
      />
    </div>
  );
};

export default SummaryMetrics;
