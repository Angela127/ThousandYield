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
  ImagePlus,
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
    image: '/images/history/img1.jpg',
    timestamp: '2024-05-08 10:15',
    prediction: 'Healthy Strawberry',
    confidence: 0.95,
    health_score: 92,
    anomaly: 'None'
  },
  {
    id: 2,
    image: '/images/history/img2.jpg',
    timestamp: '2024-05-08 09:30',
    prediction: 'Healthy Cherry Tomatoes',
    confidence: 0.97,
    health_score: 95,
    anomaly: 'None'
  },
  {
    id: 3,
    image: '/images/history/img3.jpg',
    timestamp: '2024-05-07 16:45',
    prediction: 'Optimal Growth (Hydroponic)',
    confidence: 0.99,
    health_score: 98,
    anomaly: 'None'
  },
  {
    id: 4,
    image: '/images/history/img4.jpg',
    timestamp: '2024-05-07 14:20',
    prediction: 'Downy Mildew Detected',
    confidence: 0.92,
    health_score: 35,
    anomaly: 'Fungal Infection'
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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
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
        </div>

        {/* ── Intelligence Sidebar ────────────────────────────── */}
        <div className="intelligence-sidebar">
          {/* Fast CV Analysis Card */}
          <div className="intelligence-card cv analysis-card">
            <div className="card-header">
              <div className="card-top" style={{ marginBottom: 0 }}>
                <Activity size={20} color="#3A5A40" />
                <h3>Computer Vision</h3>
              </div>
            </div>

            <div className={`cv-metrics ${!cvPrediction ? 'empty' : ''}`}>
              {cvPrediction ? (
                <>
                  <div className="cv-status">
                    <span className={`s-main ${cvPrediction.health_score > 80 ? 'success' : 'warning'}`}>
                      Health: {cvPrediction.health_score}%
                    </span>
                    <span className="s-sub">{cvPrediction.status}</span>
                  </div>

                  <div className="metric-bars">
                    <div className="m-row">
                      <span className="m-label">GREEN (HEALTH)</span>
                      <div className="m-bar-container">
                        <div className="m-bar green" style={{ width: `${cvPrediction.metrics.green_pct}%` }}></div>
                      </div>
                    </div>
                    <div className="m-row">
                      <span className="m-label">YELLOW (NITROGEN)</span>
                      <div className="m-bar-container">
                        <div className="m-bar yellow" style={{ width: `${cvPrediction.metrics.yellow_pct}%` }}></div>
                      </div>
                    </div>
                    <div className="m-row">
                      <span className="m-label">PEST INDICATORS</span>
                      <span className="m-val">{cvPrediction.metrics.pest_indicators}</span>
                    </div>
                  </div>

                  {cvPrediction.anomalies.length > 0 && (
                    <div className="cv-anomalies">
                      {cvPrediction.anomalies.map((a, i) => (
                        <div key={i} className="anomaly-pill">
                          <AlertCircle size={14} />
                          {a}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-cv">
                  <p>Run scan for real-time metrics</p>
                </div>
              )}
            </div>
          </div>

          {/* Deep AI Prediction Card */}
          <div className="intelligence-card disease analysis-card">
            <div className="card-header">
              <div className="card-top" style={{ marginBottom: 0 }}>
                <Zap size={20} color="#F59E0B" />
                <h3>AI Diagnosis</h3>
              </div>
            </div>

            <div className={`card-body ${!prediction ? 'empty' : ''}`}>

              {isLoading ? (
                <div className="prediction-loading">
                  <Loader size={24} className="spinner" />
                  <span>Analyzing image...</span>
                </div>
              ) : prediction ? (
                <>
                  <div className="disease-status">
                    <div className={`status-icon ${prediction.is_healthy ? 'success' : 'danger'}`}>
                      {prediction.is_healthy ? '✓' : '!'}
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
                      <h4>ANALYSIS LOGIC</h4>
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
                  <XCircle size={20} color="#F44336" />
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
                    <ImagePlus size={18} />
                    Upload & Scan
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Growth Tracking Card */}
          <div className="intelligence-card yield analysis-card">
            <div className="card-header">
              <div className="card-top" style={{ marginBottom: 0 }}>
                <Target size={20} color="#3A5A40" />
                <h3>Growth Tracking</h3>
              </div>
            </div>

            <div className={`card-body ${!prediction ? 'empty' : ''}`}>

              {prediction ? (
                <div className="yield-data">
                  <div className="growth-stage-display">
                    <span className="y-sub">CURRENT STAGE</span>
                    <div className="y-main">{prediction.growth_stage}</div>
                  </div>

                  <div className="anomaly-display" style={{ marginTop: '1rem' }}>
                    <span className="y-sub">DETECTED ANOMALIES</span>
                    <div className="y-main" style={{ color: prediction.anomaly === 'Normal' ? 'var(--primary-green)' : '#F44336', fontSize: '1.2rem' }}>
                      {prediction.anomaly}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="disease-status" style={{ marginTop: '1rem' }}>
                  <div className="status-icon neutral">?</div>
                  <div className="status-text">
                    <span className="s-main">No data available</span>
                    <span className="s-sub">Run AI Diagnosis first</span>
                  </div>
                </div>
              )}
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) handleFile(file);
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AdvancedAnalysis;
