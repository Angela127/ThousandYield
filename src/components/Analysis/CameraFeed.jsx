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
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import './CameraFeed.css';

const CameraFeed = ({ onSnapshot, detections = [] }) => {
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleManualUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onSnapshot(file, event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      
      let currentDevices = devices;
      if (devices.length === 0) {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        currentDevices = allDevices.filter(d => 
          d.kind === 'videoinput' && 
          !d.label.toLowerCase().includes('obs')
        );
        setDevices(currentDevices);
      }

      let deviceToUse = selectedDeviceId;
      if (!deviceToUse && currentDevices.length > 0) {
        const external = currentDevices.find(d => 
          !d.label.toLowerCase().includes('integrated') && 
          !d.label.toLowerCase().includes('facetime')
        );
        deviceToUse = external ? external.deviceId : currentDevices[currentDevices.length - 1].deviceId;
        setSelectedDeviceId(deviceToUse);
      }

      const constraints = {
        video: deviceToUse ? { deviceId: { exact: deviceToUse } } : true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      console.warn("Camera failed, trying default:", err);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onSnapshot(file, canvas.toDataURL('image/jpeg'));
        
        setScanning(true);
        setTimeout(() => setScanning(false), 1500);
      }
    }, 'image/jpeg', 0.9);
  }, [onSnapshot]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
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
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      stopCamera();
    };
  }, []);

  const toggleCamera = async () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
    stopCamera();
    setTimeout(() => startCamera(), 100);
  };

  return (
    <div className={`camera-panel ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <div className="camera-header">
        <div className="live-status">
          <span className={`status-dot ${isActive ? 'active' : ''}`}></span>
          <span className="status-text">{isActive ? 'LIVE FEED' : 'CAMERA OFF'}</span>
        </div>
        <div className="camera-actions">
          <button 
            className="control-btn" 
            onClick={() => fileInputRef.current?.click()} 
            title="Manual Upload"
          >
            <Upload size={18} />
          </button>
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
          <div className="camera-placeholder-content">
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
                {detections.length > 0 && (
                  <div className="h-stat">
                    <ShieldAlert size={12} />
                    <span>{detections.length} DETECTED</span>
                  </div>
                )}
              </div>

              {/* Detection Bounding Boxes (shown after capture) */}
              {detections.map((det, i) => (
                <div
                  key={i}
                  className={`detection-box ${det.label === 'Healthy' ? 'healthy' : 'unhealthy'}`}
                  style={{
                    left: `${det.x * 100}%`,
                    top: `${det.y * 100}%`,
                    width: `${det.w * 100}%`,
                    height: `${det.h * 100}%`,
                  }}
                >
                  <span className="detection-label">
                    {det.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="camera-controls-overlay">
              <button className="snapshot-btn" onClick={takeSnapshot} disabled={scanning}>
                <div className="btn-inner">
                  <Camera size={24} />
                </div>
                <span className="btn-label">CAPTURE ANALYSIS</span>
              </button>
              
              <div className="side-controls">
                {devices.length > 1 && (
                  <button className="power-btn" onClick={toggleCamera} title="Switch Camera">
                    <RotateCcw size={18} />
                  </button>
                )}
                
                <button className="power-btn" onClick={stopCamera} title="Turn Off">
                  <RefreshCcw size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleManualUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default CameraFeed;
