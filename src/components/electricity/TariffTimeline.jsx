import React, { useState, useEffect } from 'react';
import { isPeak, TARIFF_RATES } from '../../constants/electricityConfig';

const TariffTimeline = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = time.getHours();
  const currentMinute = time.getMinutes();
  const currentPercent = ((currentHour + currentMinute / 60) / 24) * 100;

  return (
    <div className="tariff-container">
      <div className="tariff-header">
        <h3 className="budget-title" style={{marginBottom: 0}}>Time-of-Use Tariff</h3>
        <div className="tariff-legend">
          <div className="legend-item">
            <div className="legend-dot peak"></div>
            <span>Peak: RM {TARIFF_RATES.peak_rate}/kWh</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot offpeak"></div>
            <span>Off-peak: RM {TARIFF_RATES.offpeak_rate}/kWh</span>
          </div>
        </div>
      </div>
      
      <div className="timeline-wrapper">
        <div className="timeline-row">
          {hours.map(hour => {
            const peak = isPeak(hour);
            return (
              <div 
                key={hour} 
                className={`timeline-segment ${peak ? 'peak' : 'offpeak'}`}
              >
                {hour % 4 === 0 && <span className="timeline-hour">{hour.toString().padStart(2, '0')}:00</span>}
              </div>
            );
          })}
        </div>
        <div className="current-time-indicator" style={{ left: `${currentPercent}%` }}>
          <div className="current-time-label">
            {currentHour.toString().padStart(2, '0')}:{currentMinute.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TariffTimeline;
