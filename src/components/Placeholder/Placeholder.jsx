import React from 'react';
import '../../App.css';

const Placeholder = ({ title }) => {
  const message = title || 'This module is currently being optimized for your vertical farming system.';
  return (
    <div className="placeholder-content">
      <h1>{title && title.length ? title : 'Coming Soon'}</h1>
      <p>{message}</p>
    </div>
  );
};

export default Placeholder;
