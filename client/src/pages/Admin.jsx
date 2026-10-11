import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Users,
  Compass,
  Coins,
  Activity,
  Trash2,
  UserCheck,
  CheckCircle,
  Database,
  Server,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  MapPin,
  RefreshCw,
} from 'lucide-react';

const Admin = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [tripsList, setTripsList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'trips'
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Strictly guard: Non-admin users cannot enter
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const fetchAdminData = async () => {
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    setLoading(true);
    setActionError('');
    try {
      const [statsRes, usersRes, tripsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/trips'),
      ]);

      setStatsData(statsRes.data.data);
      setUsersList(usersRes.data.data || []);
      setTripsList(tripsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      if (err.response?.status === 403) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setActionError(err.response?.data?.message || 'Failed to load administrative analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        setActionSuccess(`Role updated to ${newRole}`);
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update role');
      setTimeout(() => setActionError(''), 4000);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) {
      try {
        const res = await api.delete(`/admin/users/${userId}`);
        if (res.data.success) {
          setUsersList((prev) => prev.filter((u) => u._id !== userId));
          setActionSuccess(`User ${userName} deleted`);
          setTimeout(() => setActionSuccess(''), 3000);
        }
      } catch (err) {
        setActionError(err.response?.data?.message || 'Failed to delete user');
        setTimeout(() => setActionError(''), 4000);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-layout">
        <Navbar />
        <div className="flex-center full-page-loader">
          <LoadingSpinner message="Loading System Administrator Console..." />
        </div>
      </div>
    );
  }

  const stats = statsData?.stats || {};
  const health = statsData?.systemHealth || {};

  return (
    <div className="page-layout admin-page-layout">
      <Navbar />

      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Header Banner */}
          <div className="admin-hero-banner">
            <div className="admin-hero-content">
              <div className="admin-badge-pill">
                <ShieldAlert size={16} />
                <span>System Administration Console</span>
              </div>
              <h1 className="admin-title">WayfareHub Platform Orchestration</h1>
              <p className="admin-subtitle">
                Real-time operational monitoring, multi-currency ledger volume, and user governance.
              </p>
            </div>

            <div className="admin-header-actions">
              <button onClick={fetchAdminData} className="btn btn-secondary btn-sm refresh-btn">
                <RefreshCw size={14} />
                <span>Refresh Metrics</span>
              </button>
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                <ArrowLeft size={14} />
                <span>Return to Workspace</span>
              </Link>
            </div>
          </div>

          {actionSuccess && <div className="admin-alert success-alert">{actionSuccess}</div>}
          {actionError && <div className="admin-alert error-alert">{actionError}</div>}

          {/* Navigation Tabs */}
          <div className="admin-nav-tabs">
            <button
              className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Activity size={16} />
              <span>System Metrics</span>
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={16} />
              <span>Registered Accounts ({usersList.length})</span>
            </button>
            <button
              className={`admin-tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveTab('trips')}
            >
              <Compass size={16} />
              <span>Platform Expeditions ({tripsList.length})</span>
            </button>
          </div>

          {/* Tab 1: System Overview Metrics */}
          {activeTab === 'overview' && (
            <div className="admin-overview-grid">
              {/* Stat Cards */}
              <div className="admin-stats-row">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon-box bg-emerald">
                    <Users size={22} />
                  </div>
                  <div className="admin-stat-details">
                    <span className="stat-label">Total Registered Users</span>
                    <h3 className="stat-number">{stats.totalUsers || 0}</h3>
                    <span className="stat-sub">Across all accounts</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon-box bg-blue">
                    <Compass size={22} />
                  </div>
                  <div className="admin-stat-details">
                    <span className="stat-label">Total Expeditions</span>
                    <h3 className="stat-number">{stats.totalTrips || 0}</h3>
                    <span className="stat-sub">Active travel plans</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon-box bg-amber">
                    <Coins size={22} />
                  </div>
                  <div className="admin-stat-details">
                    <span className="stat-label">Expenses Orchestrated</span>
                    <h3 className="stat-number">{stats.totalExpenses || 0}</h3>
                    <span className="stat-sub">Converted via live FX</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon-box bg-rose">
                    <TrendingUp size={22} />
                  </div>
                  <div className="admin-stat-details">
                    <span className="stat-label">Active Base Currencies</span>
                    <h3 className="stat-number">{stats.activeCurrenciesCount || 0}</h3>
                    <span className="stat-sub">
                      {stats.activeCurrencies ? stats.activeCurrencies.join(', ') : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Two Column Health & Destinations row */}
              <div className="admin-two-col-grid">
                {/* System Health Status */}
                <div className="admin-panel-card">
                  <h3 className="admin-panel-title">
                    <Server size={18} className="text-emerald" />
                    <span>Infrastructure & Microservice Health</span>
                  </h3>
                  <div className="health-metrics-list">
                    <div className="health-item">
                      <span className="health-label">Database Connection:</span>
                      <span className="health-status online">
                        <CheckCircle size={14} /> {health.database || 'Active'}
                      </span>
                    </div>
                    <div className="health-item">
                      <span className="health-label">FX Exchange Microservice:</span>
                      <span className="health-status online">
                        <CheckCircle size={14} /> {health.fxEngine || 'Frankfurter API'}
                      </span>
                    </div>
                    <div className="health-item">
                      <span className="health-label">Server Uptime:</span>
                      <span className="health-value">{health.uptime} seconds</span>
                    </div>
                    <div className="health-item">
                      <span className="health-label">Runtime Environment:</span>
                      <span className="health-value">Node.js {health.nodeVersion}</span>
                    </div>
                  </div>
                </div>

                {/* Popular Destinations */}
                <div className="admin-panel-card">
                  <h3 className="admin-panel-title">
                    <MapPin size={18} className="text-amber" />
                    <span>Top Planned Destinations</span>
                  </h3>
                  {statsData?.popularDestinations?.length === 0 ? (
                    <p className="empty-subtext">No destination data yet.</p>
                  ) : (
                    <div className="destinations-rank-list">
                      {statsData?.popularDestinations?.map((dest, idx) => (
                        <div key={idx} className="dest-rank-item">
                          <span className="dest-rank-idx">#{idx + 1}</span>
                          <span className="dest-rank-name">{dest.destination}</span>
                          <span className="dest-rank-count">{dest.count} Trips</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: User Governance Table */}
          {activeTab === 'users' && (
            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Trips Joined</th>
                    <th>Registered On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user._id}>
                      <td className="user-name-cell">
                        <strong>{user.name}</strong>
                        {user._id === currentUser?._id && <span className="you-pill">You</span>}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role || 'user'}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td>{user.tripCount || 0}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="admin-actions-cell">
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleToggleRole(user._id, user.role || 'user')}
                          title="Toggle between admin and user"
                        >
                          <UserCheck size={13} />
                          <span>Set as {user.role === 'admin' ? 'User' : 'Admin'}</span>
                        </button>

                        {user._id !== currentUser?._id && (
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            title="Delete account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: System-Wide Trips Monitor */}
          {activeTab === 'trips' && (
            <div className="admin-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Trip Title</th>
                    <th>Destination</th>
                    <th>Owner</th>
                    <th>Members</th>
                    <th>Stops</th>
                    <th>Base Currency</th>
                    <th>Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {tripsList.map((trip) => (
                    <tr key={trip._id}>
                      <td>
                        <Link to={`/trips/${trip._id}`} className="trip-link-admin">
                          <strong>{trip.title}</strong>
                        </Link>
                      </td>
                      <td>{trip.destination}</td>
                      <td>{trip.owner?.name || 'Unknown'}</td>
                      <td>{trip.members?.length || 1}</td>
                      <td>{trip.itinerary?.length || 0}</td>
                      <td>
                        <span className="currency-pill-admin">{trip.baseCurrency}</span>
                      </td>
                      <td>
                        {new Date(trip.startDate).toLocaleDateString()} -{' '}
                        {new Date(trip.endDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
