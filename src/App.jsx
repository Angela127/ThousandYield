import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Irrigation from './components/Irrigation/Irrigation';
import Climate from './components/Climate/Climate';
import AdvancedAnalysis from './components/Analysis/AdvancedAnalysis';
import Settings from './components/Settings/Settings';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'fields':
        return <AdvancedAnalysis />;
      case 'irrigation':
        return <Irrigation />;
      case 'climate':
        return <Climate />;
      case 'setting':
        return <Settings />;
      default:
        return (
          <div className="placeholder-content">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p>This module is currently being optimized for your vertical farming system.</p>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
}

export default App;
