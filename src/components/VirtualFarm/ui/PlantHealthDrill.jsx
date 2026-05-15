import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Upload, Camera, Loader, ShieldCheck, AlertTriangle,
  Activity, Zap, ImagePlus, CheckCircle, XCircle, Clock, Leaf
} from 'lucide-react';
import './PlantHealthDrill.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CROP_IMAGES = {
  Lettuce: '/plants/lettuce.png',
  Spinach: '/plants/spinach.png',
  Kale: '/plants/kale.png',
  Basil: '/plants/basil.png',
  Arugula: '/plants/arugula.png',
};

const getHealthColor = (s) => {
  if (!s && s !== 0) return '#666';
  if (s >= 95) return '#66bb6a';
  if (s >= 85) return '#ffa726';
  return '#ef5350';
};

const PlantHealthDrill = ({ plant, cropType, rackId, onBack }) => {
  const [uploadPreview, setUploadPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [cvPrediction, setCvPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const fileInputRef = useRef(null);

  const cropImage = CROP_IMAGES[cropType] || CROP_IMAGES.Lettuce;

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target.result);
    reader.readAsDataURL(file);

    setError(null);
    setPrediction(null);
    setCvPrediction(null);
    setIsLoading(true);

    try {
      const fd1 = new FormData();
      fd1.append('file', file);
      const fd2 = new FormData();
      fd2.append('file', file);

      const [aiRes, cvRes] = await Promise.all([
        fetch(`${API_URL}/predict`, { method: 'POST', body: fd1 }),
        fetch(`${API_URL}/cv-analysis`, { method: 'POST', body: fd2 })
      ]);

      if (!aiRes.ok) {
        const errData = await aiRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${aiRes.status})`);
      }

      const aiData = await aiRes.json();
      setPrediction(aiData);

      let cvData = null;
      if (cvRes.ok) {
        cvData = await cvRes.json();
        setCvPrediction(cvData);
      }

      // Add to scan history
      setScanHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        prediction: aiData.prediction,
        confidence: aiData.confidence,
        is_healthy: aiData.is_healthy,
        health_score: cvData ? cvData.health_score : null,
      }, ...prev].slice(0, 10));

    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to API. Run: python api/app.py');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-trigger analysis on mount
  useEffect(() => {
    const autoAnalyze = async () => {
      try {
        setIsLoading(true);
        // Fetch the local image and convert to File for "upload"
        const response = await fetch(cropImage);
        const blob = await response.blob();
        const file = new File([blob], 'auto-scan.png', { type: 'image/png' });
        handleFile(file);
      } catch (err) {
        console.error("Auto-analysis failed:", err);
        setIsLoading(false);
      }
    };
    autoAnalyze();
  }, [cropImage, handleFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleReset = () => {
    setUploadPreview(null);
    setPrediction(null);
    setCvPrediction(null);
    setError(null);
  };

  if (!plant) {
    return (
      <div className="phd-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div className="phd-ai-error">
          <AlertTriangle size={24} />
          <p>No plant data selected.</p>
          <button className="phd-back-btn" onClick={onBack}>Return</button>
        </div>
      </div>
    );
  }

  const displayImage = uploadPreview || cropImage;
  const hasAnomaly = plant?.ai_detected_anomaly && plant?.ai_detected_anomaly !== 'None';

  return (
    <div className="phd-container">
      {/* Left: Photo */}
      <div className="phd-left">
        <button className="phd-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Photos</span>
        </button>

        <div className="phd-photo-area">
          <div className="phd-photo-frame">
            <img src={displayImage} alt={plant.plant_id} className="phd-photo-img" />
            {isLoading && (
              <div className="phd-scan-overlay">
                <div className="phd-scan-line" />
                <Loader size={28} className="phd-spinner" />
                <span>AI AUTO-SCANNING...</span>
              </div>
            )}
          </div>

          <div className="phd-photo-meta">
            <div className="phd-plant-badge">
              <Leaf size={14} />
              <span>{plant.plant_id}</span>
            </div>
            <span className="phd-crop-label">{cropType} · {rackId.replace('rack_', 'Rack ')}</span>
          </div>
        </div>

        <div
          className={`phd-upload-zone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} />
          <span>Update image for fresh re-scan</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
          style={{ display: 'none' }}
        />
      </div>

      {/* Right: Health Info */}
      <div className="phd-right">
        <h3 className="phd-section-title">
          <Activity size={16} />
          Health Detection Record
        </h3>

        {/* Current Plant Status */}
        <div className="phd-status-card">
          <div className="phd-status-header">
            <span className="phd-status-label">Sensor Health Score</span>
            <div className="phd-health-ring" style={{ borderColor: getHealthColor(plant.health_score) }}>
              <span style={{ color: getHealthColor(plant.health_score) }}>
                {plant.health_score?.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="phd-status-row">
            <span>LAI Value</span>
            <span className="phd-val">{plant.lai_val?.toFixed(2)}</span>
          </div>
          <div className="phd-status-row">
            <span>Anomaly (Sensor)</span>
            <span className={`phd-pill ${hasAnomaly ? 'alert' : 'ok'}`}>
              {hasAnomaly ? plant.ai_detected_anomaly : 'None'}
            </span>
          </div>
        </div>

        {/* AI Diagnosis Result */}
        <div className="phd-ai-card">
          <div className="phd-ai-header">
            <Zap size={16} color="#F59E0B" />
            <span>AI Vision Diagnosis</span>
          </div>

          {isLoading ? (
            <div className="phd-ai-loading">
              <Loader size={20} className="phd-spinner" />
              <span>Running AI analysis...</span>
            </div>
          ) : prediction ? (
            <div className="phd-ai-result">
              <div className="phd-ai-verdict">
                <div className={`phd-verdict-icon ${prediction.is_healthy ? 'healthy' : 'unhealthy'}`}>
                  {prediction.is_healthy ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <div className="phd-verdict-text">
                  <span className="phd-verdict-main">{prediction.prediction}</span>
                  <span className="phd-verdict-conf">
                    Confidence: {Math.round(prediction.confidence * 100)}%
                  </span>
                </div>
              </div>

              {prediction.growth_stage && (
                <div className="phd-status-row">
                  <span>Growth Stage</span>
                  <span className="phd-val">{prediction.growth_stage}</span>
                </div>
              )}
              {prediction.anomaly && (
                <div className="phd-status-row">
                  <span>Detected Anomaly</span>
                  <span className={`phd-pill ${prediction.anomaly === 'Normal' ? 'ok' : 'alert'}`}>
                    {prediction.anomaly}
                  </span>
                </div>
              )}
              {prediction.reasoning && (
                <div className="phd-reasoning">
                  <span className="phd-reasoning-label">Analysis Logic</span>
                  <p>{prediction.reasoning}</p>
                </div>
              )}
              <button className="phd-rescan-btn" onClick={handleReset}>
                <ImagePlus size={14} /> Scan Another Image
              </button>
            </div>
          ) : error ? (
            <div className="phd-ai-error">
              <XCircle size={18} color="#ef5350" />
              <span>{error}</span>
              <button className="phd-rescan-btn" onClick={handleReset}>Retry</button>
            </div>
          ) : (
            <div className="phd-ai-empty">
              <Camera size={24} />
              <span>Upload a plant image to run AI health detection</span>
            </div>
          )}
        </div>

        {/* CV Metrics */}
        {cvPrediction && (
          <div className="phd-cv-card">
            <div className="phd-ai-header">
              <Activity size={16} color="#66bb6a" />
              <span>Computer Vision Metrics</span>
            </div>
            <div className="phd-cv-metrics">
              <div className="phd-cv-bar">
                <span>Green (Health)</span>
                <div className="phd-bar-track">
                  <div className="phd-bar-fill green" style={{ width: `${cvPrediction.metrics?.green_pct || 0}%` }} />
                </div>
              </div>
              <div className="phd-cv-bar">
                <span>Yellow (Nitrogen)</span>
                <div className="phd-bar-track">
                  <div className="phd-bar-fill yellow" style={{ width: `${cvPrediction.metrics?.yellow_pct || 0}%` }} />
                </div>
              </div>
              <div className="phd-status-row">
                <span>CV Health Score</span>
                <span className="phd-val" style={{ color: getHealthColor(cvPrediction.health_score) }}>
                  {cvPrediction.health_score}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="phd-history-card">
            <div className="phd-ai-header">
              <Clock size={16} />
              <span>Scan History</span>
            </div>
            <div className="phd-history-list">
              {scanHistory.map(h => (
                <div key={h.id} className="phd-history-item">
                  <div className={`phd-hist-dot ${h.is_healthy ? 'ok' : 'alert'}`} />
                  <div className="phd-hist-info">
                    <span className="phd-hist-pred">{h.prediction}</span>
                    <span className="phd-hist-time">{h.timestamp}</span>
                  </div>
                  <span className="phd-hist-conf">{Math.round(h.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantHealthDrill;
