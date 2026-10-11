import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="error-banner">
      <div className="error-banner-content">
        <AlertCircle size={18} className="error-icon" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="error-dismiss-btn"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
