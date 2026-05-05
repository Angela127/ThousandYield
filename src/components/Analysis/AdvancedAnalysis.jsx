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
  ImagePlus
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

const AdvancedAnalysis = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      setPrediction(data);
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

  const handleReset = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
    setPrediction(null);
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
        <h1>Advanced Field Analysis</h1>
        <p>AI-powered computer vision and predictive yield modeling.</p>
      </header>

      <div className="analysis-grid">
        {/* ── Camera / Upload Section ───────────────────────────── */}
        <div className="camera-section">
          <div className="card-header">
            <div className="live-badge">
              <span className="dot"></span> {imagePreview ? 'UPLOADED' : 'UPLOAD'}
            </div>
            <div className="camera-controls">
              {imagePreview && (
                <button className="icon-btn" onClick={handleReset} title="Reset">
                  <RefreshCcw size={16} />
                </button>
              )}
              <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Upload image">
                <Upload size={16} />
              </button>
            </div>
          </div>
          
          <div className="video-container">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input-hidden"
            />

            {imagePreview ? (
              <>
                <img 
                  src={imagePreview}
                  alt="Uploaded leaf" 
                  className="main-feed"
                />
                
                {/* AI overlay based on prediction */}
                {prediction && (
                  <div 
                    className={`ai-overlay detection-box ${prediction.is_healthy ? '' : 'warning'}`}
                    style={{ top: '15%', left: '25%', width: '180px', height: '180px' }}
                  >
                    <div className="box-label">
                      {prediction.is_healthy ? 'Healthy' : 'Disease Detected'} • {Math.round(prediction.confidence * 100)}%
                    </div>
                  </div>
                )}

                {/* Loading overlay */}
                {isLoading && (
                  <div className="analysis-loading-overlay">
                    <div className="scan-animation">
                      <Scan size={48} />
                    </div>
                    <span>Analyzing leaf...</span>
                  </div>
                )}

                <div className="vision-stats">
                  {prediction && (
                    <>
                      <div className="v-stat">
                        <span className="v-label">Status</span>
                        <span className={`v-value ${prediction.is_healthy ? 'success' : 'danger'}`}>
                          {prediction.is_healthy ? 'Healthy' : 'Diseased'}
                        </span>
                      </div>
                      <div className="v-stat">
                        <span className="v-label">Growth Stage</span>
                        <span className="v-value">{prediction.growth_stage || 'Unknown'}</span>
                      </div>
                      <div className="v-stat">
                        <span className="v-label">Anomaly</span>
                        <span className="v-value">{prediction.anomaly || 'Normal'}</span>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div 
                className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    <ImagePlus size={48} />
                  </div>
                  <h3>Upload Plant Image</h3>
                  <p>Drag & drop a photo of a plant, or click to browse</p>
                  <p className="dropzone-hint">Supports JPG, PNG • Powered by Gemini AI</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Intelligence Sidebar ────────────────────────────── */}
        <div className="intelligence-sidebar">
          {/* Prediction Results Card */}
          <div className="intelligence-card disease">
            <div className="card-top">
              <Scan size={24} color={prediction ? (prediction.is_healthy ? '#4CAF50' : '#F44336') : '#F44336'} />
              <h3>Disease Detection</h3>
            </div>

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
                    <h4>AI Reasoning</h4>
                    <p>{prediction.reasoning}</p>
                  </div>
                )}

                <button className="scan-btn" onClick={handleReset}>
                  Scan Another Plant
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
                    <span className="s-main">No scan performed</span>
                    <span className="s-sub">Upload a leaf image to start</span>
                  </div>
                </div>
                <button className="scan-btn" onClick={() => fileInputRef.current?.click()}>
                  Upload & Scan
                </button>
              </>
            )}
          </div>

          {/* Growth & Anomaly Card */}
          <div className="intelligence-card yield">
            <div className="card-top">
              <Target size={24} color="var(--primary-green)" />
              <h3>Growth & Anomaly</h3>
            </div>
            
            {prediction ? (
              <div className="yield-data">
                <div className="growth-stage-display">
                  <span className="y-sub">Current Stage</span>
                  <div className="y-main">{prediction.growth_stage}</div>
                </div>
                
                <div className="anomaly-display" style={{ marginTop: '1rem' }}>
                  <span className="y-sub">Detected Anomalies</span>
                  <div className="y-main" style={{ color: prediction.anomaly === 'Normal' ? 'var(--primary-green)' : '#F44336', fontSize: '1.2rem' }}>
                    {prediction.anomaly}
                  </div>
                </div>
              </div>
            ) : (
              <div className="disease-status" style={{ marginTop: '1rem' }}>
                <div className="status-icon neutral">?</div>
                <div className="status-text">
                  <span className="s-main">Awaiting scan</span>
                  <span className="s-sub">Data will appear here</span>
                </div>
              </div>
            )}
          </div>

          {/* Logs Card */}
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
