import React from 'react';
import { IrrigationProvider } from '../../context/IrrigationContext';
import IrrigationAlerts from './IrrigationAlerts';
import SummaryMetrics from './SummaryMetrics';
import ZoneMonitor from './ZoneMonitor';
import UsageGraph from './UsageGraph';
import ScheduleBuilder from './ScheduleBuilder';
import OptimisationPanel from './OptimisationPanel';
import './IrrigationTab.css';

const IrrigationTabContent = () => {
  return (
    <div className="irrigation-view-container">
      <div className="irrigation-header">
        <div className="header-top-bar">
          <div className="header-text">
            <h1>Irrigation Command Center</h1>
            <p>Live moisture monitoring, automated pH dosing, and zone scheduling.</p>
          </div>
        </div>
      </div>

      <IrrigationAlerts />
      <SummaryMetrics />
      <ZoneMonitor />
      
      <div className="irrigation-mixed-grid">
        <UsageGraph />
        <ScheduleBuilder />
      </div>

      <OptimisationPanel />
    </div>
  );
};

const Irrigation = () => {
  return (
    <IrrigationProvider>
      <IrrigationTabContent />
    </IrrigationProvider>
  );
};

export default Irrigation;
