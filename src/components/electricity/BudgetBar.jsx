import React from 'react';
import { useElectricityContext } from '../../context/ElectricityContext';

const BudgetBar = () => {
  const { summary, budgetW, budgetStatus, updateBudget } = useElectricityContext();
  const pct = Math.min(100, (summary.total_W / budgetW) * 100);

  const handleBudgetChange = (e) => {
    const val = Number(e.target.value);
    if (!isNaN(val) && val > 0) {
      updateBudget(val);
    }
  };

  return (
    <div className="budget-container">
      <div className="budget-header">
        <div className="budget-title">Total Power Budget</div>
        <div className="budget-edit">
          Limit: <input type="number" value={budgetW} onChange={handleBudgetChange} /> W
        </div>
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill ${budgetStatus}`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
      <div className="budget-status">
        {Math.round(pct)}% used - {budgetStatus.toUpperCase()}
      </div>
    </div>
  );
};

export default BudgetBar;
