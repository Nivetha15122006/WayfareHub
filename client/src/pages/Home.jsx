import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  Compass,
  MapPin,
  Coins,
  Scale,
  Users,
  Calendar,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Globe2,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  BedDouble,
  Receipt,
  Lock,
  X,
  AlertCircle,
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, adminLogin } = useAuth();
  const navigate = useNavigate();

  // Admin Modal States
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminIdentifier, setAdminIdentifier] = useState('Preetham');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');

    if (!adminIdentifier || !adminPassword) {
      setAdminError('Please provide both admin username and password.');
      return;
    }

    setAdminSubmitting(true);
    const result = await adminLogin(adminIdentifier, adminPassword);
    setAdminSubmitting(false);

    if (result.success) {
      setAdminModalOpen(false);
      navigate('/admin');
    } else {
      setAdminError(result.error);
    }
  };

  return (
    <div className="page-layout">
      <Navbar />

      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-glow-sphere"></div>
          <div className="hero-glow-sphere secondary"></div>

          <div className="hero-container">
            <div className="hero-pill">
              <Sparkles size={14} className="sparkle-icon" />
              <span>WayfareHub — Smart Collaborative Travel & Multi-Currency Expense Orchestrator</span>
            </div>

            <h1 className="hero-headline">
              Wayfare<span className="serif-highlight">Hub</span> <br />
              <span className="gradient-text">Plan Expeditions Together. Orchestrate Global Expenses.</span>
            </h1>

            <p className="hero-subtext">
              <strong>WayfareHub</strong> bridges interactive map discovery, collaborative day-by-day itineraries,
              real-time foreign exchange (FX) conversion via Frankfurter, and automated greedy debt settlement into one intuitive dashboard.
            </p>

            <div className="hero-cta-group">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg glow-btn">
                  <span>Enter Your Dashboard</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg glow-btn">
                    <span>Start Planning Free</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    <span>Sign In</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(true)}
                    className="btn btn-gold btn-lg admin-hero-btn"
                    title="Open Administrator Login Portal"
                  >
                    <ShieldAlert size={18} />
                    <span>Admin Login</span>
                  </button>
                </>
              )}
            </div>

            {/* Interactive Hero Showcase Visual */}
            <div className="hero-showcase-card">
              <div className="showcase-header">
                <div className="showcase-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="showcase-title-tab">
                  <Compass size={14} />
                  <span>WayfareHub Live Workspace Preview</span>
                </div>
              </div>

              <div className="showcase-body-grid">
                <div className="showcase-widget map-widget">
                  <div className="widget-header">
                    <MapPin size={15} className="text-blue" />
                    <strong>Paris & Swiss Alps Expedition</strong>
                    <span className="badge-live">Live Map</span>
                  </div>
                  <div className="widget-preview-map">
                    <div className="map-pin-mock pin-1">
                      <BedDouble size={12} />
                      <span>The Ritz Paris</span>
                    </div>
                    <div className="map-pin-mock pin-2">
                      <MapPin size={12} />
                      <span>Eiffel Tower</span>
                    </div>
                    <div className="map-pin-mock pin-3">
                      <MapPin size={12} />
                      <span>Louvre Museum</span>
                    </div>
                  </div>
                </div>

                <div className="showcase-widget fx-widget">
                  <div className="widget-header">
                    <Coins size={15} className="text-amber" />
                    <strong>Frankfurter FX Real-Time</strong>
                  </div>
                  <div className="fx-preview-box">
                    <div className="fx-rate-line">
                      <span>100 EUR</span>
                      <span className="fx-arrow-text">➜ 1.1225 FX ➜</span>
                      <strong>$112.25 USD</strong>
                    </div>
                    <div className="fx-chip">
                      <span>✓ Rate locked at time of expense</span>
                    </div>
                  </div>

                  <div className="debt-preview-box">
                    <div className="debt-header">
                      <Scale size={13} className="text-emerald" />
                      <span>Greedy Debt Simplification</span>
                    </div>
                    <div className="settle-pill-demo">
                      <span className="debtor">Bob owes</span>
                      <ArrowRight size={13} className="arrow-demo" />
                      <span className="creditor">Alice $56.12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="features-section">
          <div className="section-container">
            <div className="section-header text-center">
              <h2 className="section-title">Everything you need for frictionless group travel</h2>
              <p className="section-subtitle">
                Engineered for friends, families, and globetrotting squads exploring the world.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon bg-blue">
                  <MapPin size={24} />
                </div>
                <h3>Interactive Map & Discovery</h3>
                <p>
                  Search any destination worldwide with OpenStreetMap. Discover hotels, attractions, and local dining, and plot stops right onto your map.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-purple">
                  <Calendar size={24} />
                </div>
                <h3>Collaborative Itineraries</h3>
                <p>
                  Organize daily schedules chronologically with times, locations, and notes. Everyone stays synchronized in real-time.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-amber">
                  <Coins size={24} />
                </div>
                <h3>Automated Multi-Currency FX</h3>
                <p>
                  Pay in JPY, EUR, or GBP — WayfareHub fetches live Frankfurter rates and locks converted values in your trip's base currency.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-emerald">
                  <Scale size={24} />
                </div>
                <h3>Greedy Debt Simplification</h3>
                <p>
                  No more messy circular I.O.U. transfers. Our bipartite matching algorithm calculates the minimum cash transactions needed.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-rose">
                  <Users size={24} />
                </div>
                <h3>Split Your Way</h3>
                <p>
                  Split equally, by exact percentages, or custom dollar shares. Every calculation is validated down to the penny.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-indigo">
                  <Globe2 size={24} />
                </div>
                <h3>Real-Time Financial Analytics</h3>
                <p>
                  Track budget consumption across Accommodation, Dining, Transport, and Activities with instant category breakdowns.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Showcase */}
        <section className="workflow-section">
          <div className="section-container">
            <div className="workflow-banner">
              <div className="workflow-text">
                <h2>Ready to turn travel chaos into effortless adventure?</h2>
                <p>Create your first trip in less than 60 seconds with full interactive planning.</p>
              </div>
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn btn-primary btn-md glow-btn">
                <span>Get Started Now</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-left">
            <div className="footer-logo">
              <Compass size={20} />
              <span>WayfareHub</span>
            </div>
            <p className="footer-tagline">Smart Collaborative Travel Itinerary & Multi-Currency Expense Orchestrator</p>
          </div>
          <div className="footer-right">
            <span>Powered by OpenStreetMap, Leaflet, Frankfurter API & MongoDB Atlas</span>
          </div>
        </div>
      </footer>

      {/* Dedicated Admin Login Modal */}
      {adminModalOpen && (
        <div className="modal-backdrop" onClick={() => setAdminModalOpen(false)}>
          <div
            className="modal-window admin-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header admin-modal-header">
              <div className="modal-title-wrap">
                <div className="admin-modal-icon-badge">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Administrator Portal</h3>
                  <p className="admin-modal-subtitle">
                    Authorized access only. Enter platform administrative credentials.
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setAdminModalOpen(false)}
                aria-label="Close Admin Modal"
              >
                <X size={20} />
              </button>
            </div>

            {adminError && (
              <div className="form-error-alert m-20-bottom">
                <AlertCircle size={16} />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="modal-form admin-modal-form">
              <div className="form-group">
                <label className="form-label">Admin Username / Email</label>
                <div className="input-with-icon">
                  <ShieldAlert size={16} className="input-icon admin-icon" />
                  <input
                    type="text"
                    className="form-input has-icon"
                    placeholder="Preetham"
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    required
                  />
                </div>
                <span className="form-hint text-gold">
                  System Admin: <strong>Preetham</strong>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Security Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    className="form-input has-icon"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAdminModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-gold glow-btn"
                  disabled={adminSubmitting}
                >
                  <span>{adminSubmitting ? 'Verifying...' : 'Access Admin Console'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
