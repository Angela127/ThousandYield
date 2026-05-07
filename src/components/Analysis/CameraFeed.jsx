import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Maximize2, 
  Minimize2, 
  CameraOff, 
  RefreshCcw, 
  Zap, 
  ShieldAlert,
  Activity,
  Download
} from 'lucide-react';
import './CameraFeed.css';

const CameraFeed = ({ onSnapshot }) => {
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      console.warn("High-res camera failed, trying default:", err);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        setIsActive(true);
      } catch (retryErr) {
        console.error("Camera access error:", retryErr);
        setError("Camera access denied. Please check permissions and ensure you are using localhost or HTTPS.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  const takeSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get blob and pass to parent
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onSnapshot(file, canvas.toDataURL('image/jpeg'));
        
        // Visual feedback
        setScanning(true);
        setTimeout(() => setScanning(false), 1500);
      }
    }, 'image/jpeg', 0.9);
  }, [onSnapshot]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play failed:", e));
    }
  }, [stream, isActive]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      stopCamera();
    };
  }, []);

  return (
    <div className={`camera-panel ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <div className="camera-header">
        <div className="live-status">
          <span className={`status-dot ${isActive ? 'active' : ''}`}></span>
          <span className="status-text">{isActive ? 'LIVE FEED' : 'CAMERA OFF'}</span>
        </div>
        <div className="camera-actions">
          <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="video-viewport">
        {error ? (
          <div className="camera-error">
            <CameraOff size={48} />
            <p>{error}</p>
            <button className="retry-btn" onClick={startCamera}>Retry Access</button>
          </div>
        ) : !isActive ? (
          <div className="camera-placeholder">
            <div className="placeholder-content">
              <Camera size={64} className="pulse-icon" />
              <h3>Initialize Monitoring</h3>
              <p>Connect to field camera for real-time analysis</p>
              <button className="start-btn" onClick={startCamera}>
                Enable Camera Feed
              </button>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="live-video"
            />
            
            {/* HUD Overlays */}
            <div className="camera-hud">
              <div className="hud-corner top-left"></div>
              <div className="hud-corner top-right"></div>
              <div className="hud-corner bottom-left"></div>
              <div className="hud-corner bottom-right"></div>
              
              {scanning && <div className="scan-line"></div>}
              
              <div className="hud-stats">
                <div className="h-stat">
                  <Activity size={12} />
                  <span>60 FPS</span>
                </div>
                <div className="h-stat">
                  <Zap size={12} />
                  <span>CV ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="camera-controls-overlay">
              <button className="snapshot-btn" onClick={takeSnapshot} disabled={scanning}>
                <div className="btn-inner">
                  <Camera size={24} />
                </div>
                <span className="btn-label">CAPTURE ANALYSIS</span>
              </button>
              
              <button className="power-btn" onClick={stopCamera} title="Turn Off">
                <RefreshCcw size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default CameraFeed;
