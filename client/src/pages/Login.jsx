import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Mail, Lock, ArrowRight, AlertCircle, ShieldAlert, User, KeyRound } from 'lucide-react';

const Login = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialIsAdmin = searchParams.get('mode') === 'admin' || searchParams.get('role') === 'admin';

  const [isAdminMode, setIsAdminMode] = useState(initialIsAdmin);
  const [identifier, setIdentifier] = useState(initialIsAdmin ? 'Preetham' : '');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('mode') === 'admin') {
      setIsAdminMode(true);
      if (!identifier) setIdentifier('Preetham');
    }
  }, [location.search]);

  const handleModeSwitch = (mode) => {
    setIsAdminMode(mode);
    setErrorMsg('');
    if (mode) {
      if (!identifier) setIdentifier('Preetham');
    } else {
      setIdentifier('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier || !password) {
      setErrorMsg('Please enter both your credentials and password.');
      return;
    }

    setSubmitting(true);

    if (isAdminMode) {
      // Exclusively authenticate as Administrator
      const result = await adminLogin(identifier, password);
      setSubmitting(false);

      if (result.success) {
        navigate('/admin', { replace: true });
      } else {
        setErrorMsg(result.error);
      }
    } else {
      // Normal traveler sign in
      const result = await login(identifier, password);
      setSubmitting(false);

      if (result.success) {
        const redirectPath = location.state?.from?.pathname || '/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMsg(result.error);
      }
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className={`auth-card ${isAdminMode ? 'admin-card-glow' : ''}`}>
        <div className="auth-card-header">
          <Link to="/" className="auth-brand">
            <Compass className="auth-logo-icon" size={32} />
            <span className="auth-brand-name">WayfareHub</span>
          </Link>

          {/* Mode Switcher Tabs */}
          <div className="auth-mode-toggle-group">
            <button
              type="button"
              className={`mode-toggle-pill ${!isAdminMode ? 'active' : ''}`}
              onClick={() => handleModeSwitch(false)}
            >
              <User size={14} />
              <span>Traveler</span>
            </button>
            <button
              type="button"
              className={`mode-toggle-pill admin-pill ${isAdminMode ? 'active' : ''}`}
              onClick={() => handleModeSwitch(true)}
            >
              <ShieldAlert size={14} />
              <span>Admin Portal</span>
            </button>
          </div>

          <h2 className="auth-title">
            {isAdminMode ? 'Administrator Gateway' : 'Welcome Back'}
          </h2>
          <p className="auth-subtitle">
            {isAdminMode
              ? 'Restricted access for system administrators only'
              : 'Sign in to orchestrate your travel trips and expenses'}
          </p>
        </div>

        {errorMsg && (
          <div className="form-error-alert">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              {isAdminMode ? 'Admin Username or Email' : 'Email Address'}
            </label>
            <div className="input-with-icon">
              {isAdminMode ? (
                <ShieldAlert size={16} className="input-icon admin-icon" />
              ) : (
                <Mail size={16} className="input-icon" />
              )}
              <input
                type={isAdminMode ? 'text' : 'email'}
                className="form-input has-icon"
                placeholder={isAdminMode ? 'Preetham' : 'you@example.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete={isAdminMode ? 'username' : 'email'}
                required
              />
            </div>
            {isAdminMode && (
              <span className="form-hint text-gold">
                Administrator Identifier: <strong>Preetham</strong>
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              {isAdminMode ? 'Admin Security Password' : 'Password'}
            </label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                className="form-input has-icon"
                placeholder={isAdminMode ? 'Enter admin password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-block auth-submit-btn ${isAdminMode ? 'btn-gold' : 'btn-primary'}`}
            disabled={submitting}
          >
            <span>
              {submitting
                ? 'Authenticating...'
                : isAdminMode
                ? 'Enter Admin Console'
                : 'Sign In to Workspace'}
            </span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-card-footer">
          {isAdminMode ? (
            <span>
              Are you a traveler?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch(false)}
                className="auth-link btn-inline"
              >
                Sign in as Traveler
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <Link to="/register" className="auth-link">
                Create an account
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
