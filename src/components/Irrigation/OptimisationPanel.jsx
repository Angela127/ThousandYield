import React from 'react';
import { useIrrigationContext } from '../../context/IrrigationContext';
import { Lightbulb, Check } from 'lucide-react';

const OptimisationPanel = () => {
  const { suggestions, dismissSuggestion } = useIrrigationContext();

  if (suggestions.length === 0) {
    return (
      <div className="optimisation-container" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: '#64748b', textAlign: 'center'}}>
        <Lightbulb size={32} color="#cbd5e1" style={{marginBottom: '8px'}} />
        <p style={{margin: 0}}>System running optimally. No suggestions at this time.</p>
      </div>
    );
  }

  return (
    <div className="optimisation-container">
      <div className="card-header">
        <h3 style={{margin: 0, color: '#0f172a'}}>Efficiency Insights</h3>
      </div>
      <div className="suggestion-grid" style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'}}>
        {suggestions.map(suggestion => (
          <div key={suggestion.id} className="suggestion-card shift" style={{display: 'flex', flexDirection: 'column', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px'}}>
            <div className="suggestion-header" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <Lightbulb size={18} color="#f59e0b" />
              <h4 style={{margin: 0, fontSize: '14px', color: '#0f172a'}}>{suggestion.title}</h4>
            </div>
            <p className="suggestion-desc" style={{margin: 0, fontSize: '13px', color: '#64748b', flexGrow: 1}}>{suggestion.desc}</p>
            <div className="suggestion-footer" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9'}}>
              <span className="suggestion-savings" style={{fontSize: '13px', fontWeight: 'bold', color: '#10b981'}}>Est. Savings: {suggestion.savings}</span>
              <button 
                className="apply-btn" 
                onClick={() => dismissSuggestion(suggestion.id)}
                style={{background: '#2196F3', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'}}
              >
                <Check size={14}/> Apply Fix
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptimisationPanel;
