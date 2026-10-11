import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="not-found-wrapper">
      <div className="not-found-card">
        <Compass size={64} className="not-found-icon" />
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Lost in Exploration?</h2>
        <p className="not-found-text">
          The page or travel itinerary you are looking for doesn't exist or has moved.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary btn-md">
            <Home size={16} />
            <span>Return Home</span>
          </Link>
          <Link to="/dashboard" className="btn btn-outline btn-md">
            <ArrowLeft size={16} />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
