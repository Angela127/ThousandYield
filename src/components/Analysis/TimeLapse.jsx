import React, { useState } from 'react';
import { Clock, Calendar, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import './TimeLapse.css';

const TimeLapse = () => {
  const [currentIndex, setCurrentIndex] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock data for time-lapse
  const history = [
    { date: '2024-05-01', stage: 'Sprout', health: 98, img: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=400' },
    { date: '2024-05-03', stage: 'Seedling', health: 96, img: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?auto=format&fit=crop&q=80&w=400' },
    { date: '2024-05-05', stage: 'Vegetative', health: 95, img: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=400' },
    { date: '2024-05-07', stage: 'Vegetative', health: 94, img: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=400' },
    { date: 'Today', stage: 'Flowering', health: 92, img: 'https://images.unsplash.com/photo-1530836361253-efad5d718465?auto=format&fit=crop&q=80&w=400' },
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % history.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + history.length) % history.length);
  };

  return (
    <div className="timelapse-panel">
      <div className="timelapse-header">
        <div className="t-title">
          <Clock size={18} color="var(--primary-green)" />
          <h3>Growth History</h3>
        </div>
        <div className="t-controls">
          <button className="t-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>

      <div className="timelapse-display">
        <img 
          src={history[currentIndex].img} 
          alt={`Plant at ${history[currentIndex].date}`} 
          className="history-img"
        />
        
        <div className="history-overlay">
          <div className="h-date">{history[currentIndex].date}</div>
          <div className="h-info">
            <span>{history[currentIndex].stage}</span>
            <span className="dot"></span>
            <span>{history[currentIndex].health}% Health</span>
          </div>
        </div>

        <button className="nav-btn prev" onClick={handlePrev}>
          <ChevronLeft size={24} />
        </button>
        <button className="nav-btn next" onClick={handleNext}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="timelapse-timeline">
        {history.map((item, index) => (
          <div 
            key={index} 
            className={`timeline-node ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          >
            <div className="node-dot"></div>
            <span className="node-label">{item.date}</span>
          </div>
        ))}
        <div className="timeline-line"></div>
      </div>
    </div>
  );
};

export default TimeLapse;
