import React from 'react';
import { ElectricityProvider } from '../context/ElectricityContext';
import SummaryMetrics from '../components/electricity/SummaryMetrics';
import BudgetBar from '../components/electricity/BudgetBar';
import ElectricityGraph from '../components/electricity/ElectricityGraph';
import DeviceTable from '../components/electricity/DeviceTable';
import TariffTimeline from '../components/electricity/TariffTimeline';
import OptimisationPlan from '../components/electricity/OptimisationPlan';
import NotificationCenter from '../components/electricity/NotificationCenter';
import '../components/electricity/ElectricityTab.css';

const ElectricityTabContent = () => {
  return (
    <div className="electricity-tab-container">
      <div className="electricity-header">
        <div className="header-top-bar">
          <div className="header-text">
            <h1>Electricity Dashboard</h1>
            <p>Monitor, control, and optimise farm power usage.</p>
          </div>
          <NotificationCenter />
        </div>
      </div>

      <SummaryMetrics />
      <BudgetBar />
      <ElectricityGraph />
      <DeviceTable />
      <TariffTimeline />
      <OptimisationPlan />
    </div>
  );
};

const ElectricityTab = () => {
  return (
    <ElectricityProvider>
      <ElectricityTabContent />
    </ElectricityProvider>
  );
};

export default ElectricityTab;
