import React from 'react';
import './FloorPlan.css';

const CROP_EMOJI = { Lettuce: '🥬', Spinach: '🍃', Kale: '🥗', Basil: '🌿', Arugula: '🌱' };

// Rack IDs matching the seed data: rack_0101 through rack_0120 and rack_0201 through rack_0220
// West Wing (Left): Row 1 (0101-0110) and Row 2 (0201-0210)
const LEFT_RACK_IDS = [
  ...Array.from({ length: 10 }, (_, i) => `rack_01${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 10 }, (_, i) => `rack_02${String(i + 1).padStart(2, '0')}`)
];

// East Wing (Right): Row 1 (0111-0120) and Row 2 (0211-0220)
const RIGHT_RACK_IDS = [
  ...Array.from({ length: 10 }, (_, i) => `rack_01${String(i + 11).padStart(2, '0')}`),
  ...Array.from({ length: 10 }, (_, i) => `rack_02${String(i + 11).padStart(2, '0')}`)
];

// ─── MINI FLOOR PLAN (header widget) ────────────────────────────────
export const FloorPlanMini = ({ racks, onClick, hoveredRackId }) => {
  const getRackDot = (rackId) => {
    const rack = racks.find(r => r.rack_id === rackId);
    let cls = rack ? 'occupied' : 'empty';
    if (hoveredRackId === rackId) cls += ' hovered';
    return cls;
  };

  return (
    <div className={`fp-mini ${onClick ? 'clickable' : ''}`} onClick={onClick || undefined} title={onClick ? "View Floor Plan" : "Floor Plan"}>
      <div className="fp-mini-header">
        <div className="fp-mini-pulse" />
        <span>FLOOR PLAN</span>
      </div>
      <div className="fp-mini-room">
        <div className="fp-mini-top">
          <div className="fp-mini-tank-pair">
            <div className="fp-mini-tank" />
            <div className="fp-mini-tank" />
          </div>
          <div className="fp-mini-computer" />
          <div className="fp-mini-tank-pair">
            <div className="fp-mini-tank" />
            <div className="fp-mini-tank" />
          </div>
        </div>
        <div className="fp-mini-racks">
          <div className="fp-mini-wing-grid">
            {LEFT_RACK_IDS.map(id => (
              <div key={id} className={`fp-mini-dot ${getRackDot(id)}`} />
            ))}
          </div>
          <div className="fp-mini-wing-grid">
            {RIGHT_RACK_IDS.map(id => (
              <div key={id} className={`fp-mini-dot ${getRackDot(id)}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="fp-mini-hint">Click to view</div>
    </div>
  );
};

// ─── FULL FLOOR PLAN PAGE ───────────────────────────────────────────
export const FloorPlanFull = ({ racks, onRackClick, selectedRackId }) => {
  const renderRackCell = (rackId) => {
    const rack = racks.find(r => r.rack_id === rackId);
    const emoji = rack ? (CROP_EMOJI[rack.crop_type] || '🌱') : null;
    const isSelected = selectedRackId === rackId;
    const plantCount = rack?.plants?.length || 0;
    const avgHealth = rack?.plants?.length
      ? (rack.plants.reduce((s, p) => s + (p.health_score || 0), 0) / rack.plants.length)
      : 0;

    const healthClass = avgHealth >= 95 ? 'excellent' : avgHealth >= 85 ? 'good' : 'poor';

    return (
      <div
        key={rackId}
        className={`fpf-rack-cell ${rack ? 'occupied' : 'empty'} ${isSelected ? 'selected' : ''}`}
        onClick={() => rack && onRackClick(rack.rack_id)}
        title={rack ? `${rackId} — ${rack.crop_type}` : 'Empty Slot'}
      >
        {rack && (
          <>
            <span className="fpf-emoji">{emoji}</span>
            <span className="fpf-rack-id-label">{rackId.replace('rack_', '')}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fpf-container">
      {/* Room outline */}
      <div className="fpf-room">
        {/* Grid background */}
        <div className="fpf-grid-bg" />

        {/* Room label */}
        <div className="fpf-room-label">
          <span className="fpf-room-name">Vertical Lab 01</span>
          <span className="fpf-room-dims">12m × 8m</span>
        </div>

        {/* Top infrastructure row */}
        <div className="fpf-infra-row">
          <div className="fpf-infra-item">
            <div className="fpf-tank-group">
              <div className="fpf-tank">💧</div>
              <div className="fpf-tank">💧</div>
            </div>
            <span className="fpf-infra-label">Tangki A</span>
          </div>

          <div className="fpf-infra-item computer">
            <div className="fpf-computer-box">
              <div className="fpf-computer-screen">
                <span>🖥️</span>
              </div>
            </div>
            <span className="fpf-infra-label">Control Station</span>
          </div>

          <div className="fpf-infra-item">
            <div className="fpf-tank-group">
              <div className="fpf-tank">💧</div>
              <div className="fpf-tank">💧</div>
            </div>
            <span className="fpf-infra-label">Tangki B</span>
          </div>
        </div>

        {/* Rack area */}
        <div className="fpf-rack-area">
          <div className="fpf-block">
            <div className="fpf-block-header">
              <span className="fpf-block-name">WEST WING</span>
              <span className="fpf-block-count">{racks.filter(r => LEFT_RACK_IDS.includes(r.rack_id)).length} Racks</span>
            </div>
            <div className="fpf-rack-grid">
              {LEFT_RACK_IDS.map(id => renderRackCell(id))}
            </div>
          </div>

          <div className="fpf-aisle">
            <div className="fpf-aisle-line" />
            <span className="fpf-aisle-label">AISLE</span>
            <div className="fpf-aisle-line" />
          </div>

          <div className="fpf-block">
            <div className="fpf-block-header">
              <span className="fpf-block-name">EAST WING</span>
              <span className="fpf-block-count">{racks.filter(r => RIGHT_RACK_IDS.includes(r.rack_id)).length} Racks</span>
            </div>
            <div className="fpf-rack-grid">
              {RIGHT_RACK_IDS.map(id => renderRackCell(id))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="fpf-legend">
          <div className="fpf-legend-item"><div className="fpf-legend-dot excellent" /> <span>Excellent (≥95%)</span></div>
          <div className="fpf-legend-item"><div className="fpf-legend-dot good" /> <span>Good (≥85%)</span></div>
          <div className="fpf-legend-item"><div className="fpf-legend-dot poor" /> <span>Needs Attention (&lt;85%)</span></div>
          <div className="fpf-legend-item"><div className="fpf-legend-dot empty-dot" /> <span>Empty Slot</span></div>
        </div>
      </div>
    </div>
  );
};
