import React from 'react';
import './AdvancedAnalysis.css';
import { 
  Camera, 
  Scan, 
  TrendingUp, 
  AlertCircle, 
  Maximize2, 
  RefreshCcw,
  Target,
  ChevronRight
} from 'lucide-react';

const AdvancedAnalysis = () => {
  return (
    <div className="advanced-view">
      <header className="view-header">
        <h1>Advanced Field Analysis</h1>
        <p>AI-powered computer vision and predictive yield modeling.</p>
      </header>

      <div className="analysis-grid">
        <div className="camera-section">
          <div className="card-header">
            <div className="live-badge">
              <span className="dot"></span> LIVE FEED
            </div>
            <div className="camera-controls">
              <button className="icon-btn"><RefreshCcw size={16} /></button>
              <button className="icon-btn"><Maximize2 size={16} /></button>
            </div>
          </div>
          
          <div className="video-container">
            <img 
              src="https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=1200&h=800" 
              alt="Plant Growth Feed" 
              className="main-feed"
            />
            
            {/* Simulated AI Overlays */}
            <div className="ai-overlay detection-box" style={{ top: '20%', left: '30%', width: '150px', height: '150px' }}>
              <div className="box-label">Healthy • 99%</div>
            </div>
            <div className="ai-overlay detection-box warning" style={{ top: '50%', left: '60%', width: '120px', height: '120px' }}>
              <div className="box-label">Checking...</div>
            </div>
            
            <div className="vision-stats">
              <div className="v-stat">
                <span className="v-label">Leaf Area Index</span>
                <span className="v-value">~2.4</span>
              </div>
              <div className="v-stat">
                <span className="v-label">Color Analysis</span>
                <span className="v-value success">Optimal Green</span>
              </div>
            </div>
          </div>
        </div>

        <div className="intelligence-sidebar">
          <div className="intelligence-card yield">
            <div className="card-top">
              <Target size={24} color="var(--primary-green)" />
              <h3>Predictive Yield</h3>
            </div>
            <div className="yield-data">
              <div className="yield-main">
                <span className="y-value">12.5</span>
                <span className="y-unit">kg / m²</span>
              </div>
              <p className="y-sub">Estimated harvest in 6 days</p>
            </div>
            <div className="confidence-meter">
              <div className="meter-label">Confidence Score: 94%</div>
              <div className="meter-bar"><div className="fill" style={{ width: '94%' }}></div></div>
            </div>
          </div>

          <div className="intelligence-card disease">
            <div className="card-top">
              <Scan size={24} color="#F44336" />
              <h3>Disease Detection</h3>
            </div>
            <div className="disease-status">
              <div className="status-icon success">✓</div>
              <div className="status-text">
                <span className="s-main">No anomalies found</span>
                <span className="s-sub">Last scanned: 2 mins ago</span>
              </div>
            </div>
            <button className="scan-btn">Initiate Deep Scan</button>
          </div>

          <div className="intelligence-card logs">
            <h3>Automation Logs</h3>
            <div className="log-list">
              {[
                { action: 'Nutrient Injection', time: '10:15 AM', res: 'Success' },
                { action: 'Light Spectrum Shift', time: '09:00 AM', res: 'Success' },
                { action: 'Water Filter Flush', time: 'Yesterday', res: 'Manual' },
              ].map((log, i) => (
                <div key={i} className="log-item">
                  <span className="l-time">{log.time}</span>
                  <span className="l-action">{log.action}</span>
                  <ChevronRight size={14} color="#ccc" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalysis;
