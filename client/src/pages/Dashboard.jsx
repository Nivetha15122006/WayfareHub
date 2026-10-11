import React, { useState, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import TripCard from '../components/TripCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Plus, Compass, Calendar, MapPin, Coins, Sparkles, X, AlertCircle } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'CHF', 'NZD', 'THB', 'AED'];

const Dashboard = () => {
  const { trips, loading, error, fetchTrips, createNewTrip, deleteExistingTrip } = useTrip();
  const { currentUser } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleOpenModal = () => {
    setTitle('');
    setDestination('');
    // Default dates: tomorrow to +5 days
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const end = new Date();
    end.setDate(end.getDate() + 6);

    setStartDate(tmrw.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setBaseCurrency('USD');
    setFormError('');
    setModalOpen(true);
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !destination.trim() || !startDate || !endDate) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Trip end date cannot be earlier than start date.');
      return;
    }

    setCreating(true);
    const result = await createNewTrip({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      baseCurrency,
    });
    setCreating(false);

    if (result.success) {
      setModalOpen(false);
    } else {
      setFormError(result.error);
    }
  };

  const handleDeleteTrip = async (tripId, tripTitle) => {
    if (window.confirm(`Are you sure you want to permanently delete "${tripTitle}" and all its expenses and itinerary?`)) {
      await deleteExistingTrip(tripId);
    }
  };

  return (
    <div className="page-layout">
      <Navbar onOpenNewTripModal={handleOpenModal} />

      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Dribbble Inspired Editorial Hero Banner */}
          <div className="dashboard-hero-dribbble">
            <div className="hero-editorial-content">
              <div className="dashboard-brand-pill">
                <Sparkles size={14} className="sparkle-icon" />
                <span>WayfareHub — Smart Collaborative Travel Itinerary & Multi-Currency Expense Orchestrator</span>
              </div>

              <span className="greeting-pill-gold">
                Welcome back, {currentUser?.name?.split(' ')[0] || 'Traveler'}
              </span>

              <h1 className="hero-dribbble-title">
                Wayfare<span className="serif-highlight">Hub</span> Workspace
              </h1>

              <p className="hero-dribbble-subtitle">
                Adventure, culture, and financial harmony all in one collaborative travel workspace. Orchestrate multi-currency expenses with live FX rates and settle group debts seamlessly.
              </p>

              <div className="hero-quick-stats">
                <div className="stat-pill">
                  <strong>{trips.length}</strong>
                  <span>Expeditions</span>
                </div>
                <div className="stat-pill">
                  <strong>{new Set(trips.map(t => t.destination)).size}</strong>
                  <span>Destinations</span>
                </div>
                <div className="stat-pill">
                  <strong>{new Set(trips.map(t => t.baseCurrency)).size}</strong>
                  <span>Currencies</span>
                </div>
              </div>
            </div>

            <div className="hero-editorial-actions">
              <button
                onClick={handleOpenModal}
                className="btn btn-primary btn-lg create-journey-btn glow-btn"
              >
                <Plus size={20} />
                <span>Create New Trip</span>
              </button>
            </div>

            {/* Dotted Journey Path SVG Decorative Line */}
            <div className="journey-path-svg-wrap">
              <svg viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="journey-svg">
                <path
                  d="M10 90 Q 200 10, 400 70 T 790 30"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="8 8"
                  opacity="0.35"
                />
              </svg>
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          {/* Trips Content */}
          {loading && trips.length === 0 ? (
            <div className="dashboard-loader">
              <LoadingSpinner message="Fetching your travel workspaces..." />
            </div>
          ) : trips.length === 0 ? (
            <div className="dashboard-empty-card">
              <div className="empty-illustration">
                <Compass size={48} className="empty-compass" />
              </div>
              <h3 className="empty-title">No travel trips yet</h3>
              <p className="empty-description">
                Plan a weekend getaway, road trip, or international vacation with your travel companions.
              </p>
              <button onClick={handleOpenModal} className="btn btn-primary btn-md">
                <Plus size={16} />
                <span>Create Your First Trip</span>
              </button>
            </div>
          ) : (
            <section className="trips-section">
              <div className="trips-section-header">
                <h3 className="trips-count-title">
                  All Expeditions <span className="trips-counter">({trips.length})</span>
                </h3>
              </div>

              <div className="trips-grid">
                {trips.map((trip) => (
                  <TripCard
                    key={trip._id}
                    trip={trip}
                    onDelete={handleDeleteTrip}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Create Trip Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Sparkles size={20} className="modal-icon" />
                <h3 className="modal-title">Create New Trip</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="form-error-alert">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTrip} className="modal-form">
              <div className="form-group">
                <label className="form-label">Trip Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Euro Summer Adventure 2026, Tokyo Food Tour"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination (City, Country) *</label>
                <div className="input-with-icon">
                  <MapPin size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input has-icon"
                    placeholder="e.g. Paris, France or Tokyo, Japan"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">End Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Trip Base Currency *</label>
                <div className="input-with-icon">
                  <Coins size={16} className="input-icon" />
                  <select
                    className="form-select has-icon"
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr} (All expenses convert to this currency)
                      </option>
                    ))}
                  </select>
                </div>
                <small className="form-hint">
                  All expenses entered in foreign currencies will automatically convert to {baseCurrency} using live rates.
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating Trip...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
