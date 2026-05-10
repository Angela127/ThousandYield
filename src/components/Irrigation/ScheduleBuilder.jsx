import React, { useState } from 'react';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { Clock, ArrowRight, Plus, Trash2, Check, X } from 'lucide-react';

const ScheduleBuilder = () => {
  const { schedules, zones, updateSchedule, deleteSchedule, addSchedule } = useIrrigationContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newSch, setNewSch] = useState({ zoneId: zones[0]?.id || '', time: '12:00', durationMinutes: 10 });

  const handleToggle = (id, currentStatus) => {
    updateSchedule(id, { enabled: !currentStatus });
  };

  const handleAdd = () => {
    addSchedule(newSch);
    setIsAdding(false);
  };

  return (
    <div className="schedule-card functional">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>Irrigation Schedule</h3>
        <button
          className="add-schedule-btn"
          onClick={() => setIsAdding(!isAdding)}
          style={{
            background: '#eff6ff', border: 'none', color: '#3b82f6',
            padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
            fontWeight: '700', display: 'flex', alignItems: 'center', cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {isAdding ? <><X size={14} style={{ marginRight: '4px' }} /> Cancel</> : <><Plus size={14} style={{ marginRight: '4px' }} /> Add New</>}
        </button>
      </div>

      <div className="schedule-list" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {isAdding && (
          <div className="schedule-item adding" style={{ background: '#f0f9ff', border: '1px dashed #3b82f6', marginBottom: '1rem', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={newSch.zoneId}
                onChange={(e) => setNewSch({ ...newSch, zoneId: e.target.value })}
                style={{ flex: 1, padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid #bfdbfe' }}
              >
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
              <input
                type="time"
                value={newSch.time}
                onChange={(e) => setNewSch({ ...newSch, time: e.target.value })}
                style={{ padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid #bfdbfe' }}
              />
              <input
                type="number"
                value={newSch.durationMinutes}
                onChange={(e) => setNewSch({ ...newSch, durationMinutes: parseInt(e.target.value) })}
                placeholder="Min"
                style={{ width: '60px', padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid #bfdbfe' }}
              />
              <button onClick={handleAdd} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}>
                <Check size={16} />
              </button>
            </div>
          </div>
        )}

        {schedules.length === 0 && !isAdding && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            No schedules set. Click "Add New" to automate your irrigation.
          </div>
        )}

        {schedules.map((item) => {
          const zone = zones.find(z => z.id === item.zoneId);
          return (
            <div key={item.id} className={`schedule-item ${!item.enabled ? 'disabled' : ''}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f8fafc', borderRadius: '1rem',
              marginBottom: '0.75rem', border: '1px solid #f1f5f9',
              transition: 'all 0.2s'
            }}>
              <div className="time-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={18} color={item.enabled ? '#3b82f6' : '#94a3b8'} />
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: item.enabled ? '#0f172a' : '#94a3b8' }}>{item.time}</span>
              </div>

              <div className="zone-info" style={{ flex: 1, marginLeft: '1.5rem' }}>
                <div style={{ fontWeight: 700, color: item.enabled ? '#334155' : '#94a3b8' }}>{zone ? zone.name : item.zoneId}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{item.durationMinutes} min run</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  onClick={() => handleToggle(item.id, item.enabled)}
                  className={`status-tag ${item.enabled ? 'upcoming' : 'disabled'}`}
                  style={{
                    cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '999px',
                    fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                    background: item.enabled ? '#dcfce7' : '#f1f5f9',
                    color: item.enabled ? '#166534' : '#64748b',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.enabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  onClick={() => deleteSchedule(item.id)}
                  style={{
                    background: 'none', border: 'none', color: '#cbd5e1',
                    cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleBuilder;
