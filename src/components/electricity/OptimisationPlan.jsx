import React from 'react';
import { useElectricityContext } from '../../context/ElectricityContext';
import { Clock, ZapOff, ShieldAlert, CheckCircle } from 'lucide-react';

const OptimisationPlan = () => {
  const { suggestions, applySuggestion } = useElectricityContext();

  const totalSavings = suggestions
    .filter(s => !s.applied)
    .reduce((sum, s) => sum + parseFloat(s.savings_per_day), 0);

  if (suggestions.length === 0) return null;

  return (
    <div className="optimisation-container">
      <h3 className="budget-title">Optimisation Plan</h3>
      <div className="suggestion-grid">
        {suggestions.map(sug => {
          let Icon = Clock;
          if (sug.type === 'cap') Icon = ZapOff;
          if (sug.type === 'cut') Icon = ShieldAlert;

          return (
            <div key={sug.id} className={`suggestion-card ${sug.type}`}>
              <div className="suggestion-header">
                <div className="suggestion-icon-wrapper">
                  <Icon size={18} />
                </div>
                <span className="suggestion-title">{sug.title}</span>
              </div>
              <div className="suggestion-desc">{sug.description}</div>
              <div className="suggestion-footer">
                <span className="suggestion-savings">RM {sug.savings_per_day}/day</span>
                <button 
                  className="apply-btn" 
                  onClick={() => applySuggestion(sug)}
                  disabled={sug.applied}
                  style={sug.applied ? {background: '#e2e8f0', color: '#64748b'} : {}}
                >
                  {sug.applied ? <CheckCircle size={16} /> : 'Apply'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {totalSavings > 0 && (
        <div style={{marginTop: '1.5rem', textAlign: 'right', fontWeight: '600', color: '#3A5A40'}}>
          Total Potential Savings: RM {totalSavings.toFixed(2)} / day
        </div>
      )}
    </div>
  );
};

export default OptimisationPlan;
