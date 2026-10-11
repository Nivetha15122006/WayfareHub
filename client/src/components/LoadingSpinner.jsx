import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  return (
    <div className={`spinner-container ${size}`}>
      <div className="spinner-ring"></div>
      {message && <p className="spinner-text">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
