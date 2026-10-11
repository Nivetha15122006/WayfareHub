import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Compass, User, LogOut, Menu, X, PlusCircle, Layers, Sun, Moon, ShieldAlert } from 'lucide-react';

const Navbar = ({ onOpenNewTripModal }) => {
  const { currentUser, logout, isAuthenticated, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="site-header">
      <div className="nav-container">
        <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="logo-badge">
            <Compass className="logo-icon" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Wayfare<span className="brand-highlight">Hub</span></span>
            <span className="brand-tagline">Travel & FX Orchestrator</span>
          </div>
        </Link>

        {/* Mobile Hamburger Button */}
        <div className="mobile-header-right">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn mobile-theme-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} className="theme-icon sun" /> : <Moon size={18} className="theme-icon moon" />}
          </button>

          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Navigation Links & Actions */}
        <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Theme Toggle Button for desktop */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn desktop-theme-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <span className="theme-toggle-inner">
                <Sun size={17} className="theme-icon sun" />
                <span className="theme-label-text">Light</span>
              </span>
            ) : (
              <span className="theme-toggle-inner">
                <Moon size={17} className="theme-icon moon" />
                <span className="theme-label-text">Dark</span>
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <>
              <div className="nav-links">
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Layers size={18} />
                  <span>Dashboard</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShieldAlert size={18} />
                    <span>Admin Console</span>
                  </Link>
                )}
              </div>

              <div className="nav-user-actions">
                {onOpenNewTripModal && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenNewTripModal();
                    }}
                    className="btn btn-primary btn-sm create-trip-nav-btn"
                  >
                    <PlusCircle size={16} />
                    <span>New Trip</span>
                  </button>
                )}

                <div className="user-profile-badge">
                  <div className="user-avatar-circle">
                    {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="user-details-text">
                    <span className="user-name">{currentUser?.name}</span>
                    <span className="user-email">{currentUser?.email}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm logout-btn"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="nav-guest-actions">
              <Link
                to="/login"
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/login?mode=admin"
                className="btn btn-outline btn-sm admin-nav-link-btn"
                onClick={() => setMobileMenuOpen(false)}
                title="Administrator Portal"
              >
                <ShieldAlert size={14} />
                <span>Admin Login</span>
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
