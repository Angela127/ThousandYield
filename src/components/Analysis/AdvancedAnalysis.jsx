import React, { useState, useRef, useCallback } from 'react';
import './AdvancedAnalysis.css';
import {
  Camera,
  Scan,
  TrendingUp,
  AlertCircle,
  Maximize2,
  RefreshCcw,
  Target,
  ChevronRight,
  Upload,
  Loader,
  CheckCircle,
  XCircle,

  Activity,
  ShieldAlert,
  Zap,
  History,
  X
} from 'lucide-react';
import CameraFeed from './CameraFeed';
import TimeLapse from './TimeLapse';

const API_URL = 'http://localhost:8000';

const CAPTURE_HISTORY = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=400',
    timestamp: '2024-05-07 14:20',
    prediction: 'Healthy Tomato',
    confidence: 0.98,
    health_score: 96,
    anomaly: 'None'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=400',
    timestamp: '2024-05-07 12:45',
    prediction: 'Bacterial Spot',
    confidence: 0.89,
    health_score: 42,
    anomaly: 'Disease Detected'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e17?auto=format&fit=crop&q=80&w=400',
    timestamp: '2024-05-06 16:10',
    prediction: 'Late Blight',
    confidence: 0.76,
    health_score: 28,
    anomaly: 'Critical Alert'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
    timestamp: '2024-05-06 09:30',
    prediction: 'Early Blight',
    confidence: 0.92,
    health_score: 55,
    anomaly: 'Stress Detected'
  }
];

const AdvancedAnalysis = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cvPrediction, setCvPrediction] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, etc.)');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    setUploadedImage(file);
    setError(null);
    setPrediction(null);
    setIsLoading(true);

    try {
      const formData1 = new FormData();
      formData1.append('file', file);
      const formData2 = new FormData();
      formData2.append('file', file);

      // Run BOTH Deep AI and Fast CV in parallel
      const [aiRes, cvRes] = await Promise.all([
        fetch(`${API_URL}/predict`, { method: 'POST', body: formData1 }),
        fetch(`${API_URL}/cv-analysis`, { method: 'POST', body: formData2 })
      ]);

      if (!aiRes.ok) {
        const errData = await aiRes.json().catch(() => ({}));
        throw new Error(errData.detail || `AI Server error (${aiRes.status})`);
      }

      const aiData = await aiRes.json();
      setPrediction(aiData);

      if (cvRes.ok) {
        const cvData = await cvRes.json();
        setCvPrediction(cvData);
      }
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to the API server. Make sure to run: python api/app.py');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);



  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSnapshot = useCallback((file, previewUrl) => {
    setImagePreview(previewUrl);
    handleFile(file);
  }, [handleFile]);

  const handleReset = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
    setPrediction(null);
    setCvPrediction(null);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'var(--primary-green)';
    if (confidence >= 0.5) return '#FFB300';
    return '#F44336';
  };

  return (
    <div className="advanced-view">
      <header className="view-header">
        <div className="header-main">
          <h1>Advanced Field Analysis</h1>
          <p>AI-powered computer vision and predictive yield modeling.</p>
        </div>
        <button className="history-toggle-btn" onClick={() => setShowHistory(true)}>
          <History size={20} />
          <span>History</span>
        </button>
      </header>

      <div className="analysis-grid">
        {/* ── Camera & Field Feed Section ────────────────────────── */}
        <div className="main-analysis-area">
          <CameraFeed onSnapshot={handleSnapshot} detections={cvPrediction?.detections || []} />
          
          <div className="secondary-views">
            <TimeLapse />
          </div>
        </div>

        {/* ── Intelligence Sidebar ────────────────────────────── */}
        <div className="intelligence-sidebar">
          {/* Fast CV Analysis Card */}
          <div className="analysis-card intelligence-card cv">
            <div className="card-top">
              <Activity size={24} color={cvPrediction ? 'var(--primary-green)' : '#94a3b8'} />
              <h3>Computer Vision</h3>
            </div>

            {cvPrediction ? (
              <div className="cv-metrics">
                <div className="cv-status">
                  <span className={`s-main ${cvPrediction.health_score > 80 ? 'success' : 'warning'}`}>
                    Health: {cvPrediction.health_score}%
                  </span>
                  <span className="s-sub">{cvPrediction.status}</span>
                </div>

                <div className="metric-bars">
                  <div className="m-row">
                    <span className="m-label">Green (Health)</span>
                    <div className="m-bar-container">
                      <div className="m-bar green" style={{ width: `${cvPrediction.metrics.green_pct}%` }}></div>
                    </div>
                  </div>
                  <div className="m-row">
                    <span className="m-label">Yellow (Nitrogen)</span>
                    <div className="m-bar-container">
                      <div className="m-bar yellow" style={{ width: `${cvPrediction.metrics.yellow_pct}%` }}></div>
                    </div>
                  </div>
                  <div className="m-row">
                    <span className="m-label">Pest Indicators</span>
                    <span className="m-val">{cvPrediction.metrics.pest_indicators}</span>
                  </div>
                </div>

                {cvPrediction.anomalies.length > 0 && (
                  <div className="cv-anomalies">
                    {cvPrediction.anomalies.map((a, i) => (
                      <div key={i} className="anomaly-tag">
                        <ShieldAlert size={12} />
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-cv">
                <p>Run scan for real-time metrics</p>
              </div>
            )}
          </div>

          {/* Deep AI Prediction Card */}
          <div className="analysis-card intelligence-card disease">
            <div className="card-top">
              <Zap size={24} color={prediction ? '#FFB300' : '#94a3b8'} />
              <h3>AI Diagnosis</h3>
            </div>

            {isLoading ? (
              <div className="prediction-loading">
                <Loader size={32} className="spinner" />
                <span>Analyzing patterns...</span>
              </div>
            ) : prediction ? (
              <>
                <div className="disease-status">
                  <div className={`status-icon ${prediction.is_healthy ? 'success' : 'danger'}`}>
                    {prediction.is_healthy ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div className="status-text">
                    <span className="s-main">{prediction.prediction}</span>
                    <span className="s-sub">
                      Confidence: {Math.round(prediction.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* AI Reasoning */}
                {prediction.reasoning && (
                  <div className="ai-reasoning">
                    <h4>Analysis Logic</h4>
                    <p>{prediction.reasoning}</p>
                  </div>
                )}

                <button className="scan-btn" onClick={handleReset}>
                  <RefreshCcw size={16} />
                  Scan Another
                </button>
              </>
            ) : error ? (
              <div className="prediction-error">
                <XCircle size={32} color="#ef4444" />
                <span>{error}</span>
                <button className="scan-btn" onClick={handleReset}>Try Again</button>
              </div>
            ) : (
              <>
                <div className="disease-status">
                  <div className="status-icon neutral">?</div>
                  <div className="status-text">
                    <span className="s-main">Awaiting Scan</span>
                    <span className="s-sub">Capture or upload image</span>
                  </div>
                </div>
                <button className="scan-btn" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} />
                  Upload & Scan
                </button>
              </>
            )}
          </div>

          {/* Growth & Anomaly Card */}
          <div className="analysis-card intelligence-card yield">
            <div className="card-top">
              <Target size={24} color="var(--primary-green)" />
              <h3>Growth Tracking</h3>
            </div>

            {prediction ? (
              <div className="yield-data">
                <div className="growth-stage-display">
                  <span className="y-sub">Current Stage</span>
                  <div className="y-main">{prediction.growth_stage}</div>
                </div>

                <div className="anomaly-display" style={{ marginTop: '1.5rem' }}>
                  <span className="y-sub">Detected Anomalies</span>
                  <div className="y-main" style={{ color: prediction.anomaly === 'Normal' ? 'var(--primary-green)' : '#ef4444' }}>
                    {prediction.anomaly}
                  </div>
                </div>
              </div>
            ) : (
              <div className="disease-status" style={{ background: 'transparent', padding: 0 }}>
                <div className="status-icon neutral">?</div>
                <div className="status-text">
                  <span className="s-main">No data available</span>
                  <span className="s-sub">Run AI Diagnosis first</span>
                </div>
              </div>
            )}
          </div>

          {/* Logs Card */}
          <div className="analysis-card intelligence-card logs">
            <div className="card-top">
              <h3>Automation Logs</h3>
            </div>
            <div className="log-list">
              {[
                { action: 'Nutrient Injection', time: '10:15 AM' },
                { action: 'Spectrum Shift', time: '09:00 AM' },
                { action: 'Filter Flush', time: 'Yesterday' },
              ].map((log, i) => (
                <div key={i} className="log-item">
                  <span className="l-time">{log.time}</span>
                  <span className="l-action">{log.action}</span>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Technical History Overlay ───────────────────────── */}
      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="header-title">
                <History size={20} />
                <h3>Analysis Archive</h3>
              </div>
              <button className="close-modal" onClick={() => setShowHistory(false)}>
                <X size={24} />
              </button>
            </header>
            
            <div className="history-content">
              <div className="archive-grid">
                {CAPTURE_HISTORY.map((item) => (
                  <div key={item.id} className="archive-item">
                    <div className="archive-media">
                      <img src={item.image} alt={item.prediction} />
                      <div className="archive-status-tag" style={{ 
                        background: item.health_score > 80 ? 'var(--primary-green)' : 
                                    item.health_score > 50 ? '#FFB300' : '#F44336' 
                      }}>
                        {item.health_score}%
                      </div>
                    </div>
                    <div className="archive-info">
                      <span className="a-date">{item.timestamp}</span>
                      <h4 className="a-title">{item.prediction}</h4>
                      <div className="a-metrics">
                        <span>Conf: {Math.round(item.confidence * 100)}%</span>
                        <span className={`a-anomaly ${item.anomaly === 'None' ? 'normal' : 'alert'}`}>
                          {item.anomaly}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalysis;
