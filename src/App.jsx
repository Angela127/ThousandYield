import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Irrigation from './components/Irrigation/Irrigation';
import Climate from './components/Climate/Climate';
import AdvancedAnalysis from './components/Analysis/AdvancedAnalysis';
import Settings from './components/Settings/Settings';
import Placeholder from './components/Placeholder/Placeholder';
const VirtualFarm = lazy(() => import('./components/VirtualFarm/VirtualFarm'));
import './App.css';

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'calc(100vw - 240px)',
    height: '100vh',
    marginLeft: '240px',
    backgroundColor: '#DAD7CD',
    flexDirection: 'column',
    gap: '20px'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '4px solid rgba(58, 90, 64, 0.2)',
      borderTop: '4px solid #3A5A40',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ color: '#3A5A40', fontSize: '16px', fontWeight: '500' }}>Initializing Virtual Farm...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route 
          path="/virtual-farm" 
          element={
            <Suspense fallback={<LoadingScreen />}>
              <VirtualFarm />
            </Suspense>
          } 
        />
        <Route path="/fields" element={<AdvancedAnalysis />} />
        <Route path="/irrigation" element={<Irrigation />} />
        <Route path="/environment" element={<Climate />} />
        <Route path="/settings" element={<Settings />} />
        {/* Unimplemented pages use the Placeholder component */}
        <Route path="/reports" element={<Placeholder />} />
        <Route path="/help" element={<Placeholder />} />
        <Route path="/notifications" element={<Placeholder title="Notifications" />} />
      </Routes>
    </div>
  );
}

export default App;
