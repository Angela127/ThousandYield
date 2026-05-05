import React, { useState } from 'react';
import './FlagSystem.css';

/**
 * Flag system for marking towers that need attention
 */
export const FlagSystemModal = ({ isOpen, onClose, tower, onFlagSubmit }) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !tower) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onFlagSubmit(tower.uuid, reason);
    setReason('');
    onClose();
  };

  return (
    <div className="vf-modal-overlay" onClick={onClose}>
      <div className="vf-flag-modal" onClick={e => e.stopPropagation()}>
        <div className="vf-flag-header">
          <div className="vf-flag-icon">🚩</div>
          <h2>Flag Tower</h2>
          <button className="vf-close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="vf-flag-content">
          <p className="vf-flag-desc">
            Flagging <strong>{tower.userData.species}</strong> at position ({tower.userData.position.x.toFixed(1)}, {tower.userData.position.z.toFixed(1)})
          </p>
          
          <div className="vf-form-group">
            <label htmlFor="flagReason">Reason for inspection:</label>
            <textarea 
              id="flagReason"
              placeholder="e.g. Yellowing leaves on bottom row, suspected nutrient deficiency..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
            />
          </div>
          
          <div className="vf-flag-actions">
            <button type="button" className="vf-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="vf-btn-danger">Add Flag</button>
          </div>
        </form>
      </div>
    </div>
  );
};
