import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Edit3, Save, X, DollarSign } from 'lucide-react';
import api from '../services/api';

const CATEGORY_COLORS = {
  Accommodation: '#3b82f6',
  Food: '#10b981',
  Transportation: '#f59e0b',
  Activities: '#8b5cf6',
  Shopping: '#ec4899',
  Flights: '#06b6d4',
  Miscellaneous: '#64748b',
};

const TripBudgetCard = ({ trip, expenses = [], onBudgetUpdated }) => {
  const baseCurrency = trip?.baseCurrency || 'USD';
  const currentBudget = trip?.budget || 0;

  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(currentBudget > 0 ? currentBudget : '');
  const [saving, setSaving] = useState(false);

  const totalSpent = expenses.reduce((acc, curr) => acc + (curr.convertedAmount || 0), 0);
  const roundedSpent = Math.round(totalSpent * 100) / 100;

  const hasBudget = currentBudget > 0;
  const percentUsed = hasBudget ? Math.min(100, Math.round((roundedSpent / currentBudget) * 100)) : 0;
  const remainingBudget = Math.round((currentBudget - roundedSpent) * 100) / 100;
  const isOverBudget = hasBudget && roundedSpent > currentBudget;
  const isNearBudget = hasBudget && percentUsed >= 80 && !isOverBudget;

  // Category breakdown
  const categoryTotals = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'Miscellaneous';
    acc[cat] = (acc[cat] || 0) + (exp.convertedAmount || 0);
    return acc;
  }, {});

  const handleSaveBudget = async () => {
    const num = parseFloat(budgetInput);
    if (isNaN(num) || num < 0) {
      alert('Please enter a valid positive budget amount.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/trips/${trip._id}`, { budget: num });
      if (res.data.success) {
        setIsEditing(false);
        if (onBudgetUpdated) {
          onBudgetUpdated(res.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to update budget:', err);
      alert('Failed to update trip budget. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = () => {
    if (!hasBudget) return 'var(--primary)';
    if (isOverBudget) return '#ef4444';
    if (isNearBudget) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="budget-progress-panel">
      <div className="budget-panel-header">
        <div className="budget-title-wrap">
          <div className="budget-icon-circle">
            <Target size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="budget-title">Trip Budget & Category Burn Rate</h3>
            <p className="budget-subtitle">
              Target financial allocation and real-time converted spending velocity in {baseCurrency}
            </p>
          </div>
        </div>

        <div className="budget-header-actions">
          {isEditing ? (
            <div className="budget-edit-input-group">
              <span className="budget-currency-label">{baseCurrency}</span>
              <input
                type="number"
                min="0"
                step="any"
                className="budget-number-input"
                placeholder="e.g. 50000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={handleSaveBudget}
                disabled={saving}
              >
                <Save size={13} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setIsEditing(false);
                  setBudgetInput(currentBudget > 0 ? currentBudget : '');
                }}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm edit-budget-btn"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={14} />
              <span>{hasBudget ? 'Edit Target Budget' : 'Set Trip Budget'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Budget Progress Metrics */}
      <div className="budget-metrics-row">
        <div className="budget-metric-block">
          <span className="metric-label">Target Budget</span>
          <h4 className="metric-val">
            {hasBudget ? `${currentBudget.toLocaleString()} ${baseCurrency}` : 'Not Specified'}
          </h4>
        </div>

        <div className="budget-metric-block">
          <span className="metric-label">Total Expended</span>
          <h4 className="metric-val text-blue">
            {roundedSpent.toLocaleString()} {baseCurrency}
          </h4>
        </div>

        <div className="budget-metric-block">
          <span className="metric-label">Remaining Balance</span>
          <h4 className={`metric-val ${isOverBudget ? 'text-rose' : 'text-emerald'}`}>
            {hasBudget ? `${remainingBudget.toLocaleString()} ${baseCurrency}` : '—'}
          </h4>
        </div>

        <div className="budget-metric-block">
          <span className="metric-label">Burn Velocity</span>
          <div className="metric-badge-wrap">
            {hasBudget ? (
              <span
                className={`budget-status-pill ${
                  isOverBudget ? 'alert-danger' : isNearBudget ? 'alert-warning' : 'alert-success'
                }`}
              >
                {isOverBudget ? (
                  <>
                    <AlertTriangle size={13} /> Over Budget by {(roundedSpent - currentBudget).toLocaleString()} {baseCurrency}
                  </>
                ) : isNearBudget ? (
                  <>
                    <AlertTriangle size={13} /> {percentUsed}% Consumed (Caution)
                  </>
                ) : (
                  <>
                    <CheckCircle size={13} /> {percentUsed}% Consumed (On Track)
                  </>
                )}
              </span>
            ) : (
              <span className="budget-status-pill alert-neutral">
                Set a budget to track burn velocity
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Dynamic Progress Bar */}
      {hasBudget && (
        <div className="budget-progress-track-wrapper">
          <div className="progress-bar-rail">
            <div
              className="progress-bar-fill"
              style={{
                width: `${percentUsed}%`,
                backgroundColor: getStatusColor(),
              }}
            ></div>
          </div>
          <div className="progress-labels-row">
            <span>0 {baseCurrency}</span>
            <span>{percentUsed}% of goal</span>
            <span>{currentBudget.toLocaleString()} {baseCurrency}</span>
          </div>
        </div>
      )}

      {/* Category Burn Rate Breakdown Mini-bars */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="category-burn-section">
          <h5 className="category-burn-heading">Category Spending Breakdown</h5>
          <div className="category-bars-grid">
            {Object.entries(categoryTotals).map(([cat, amount]) => {
              const catPercent = roundedSpent > 0 ? Math.round((amount / roundedSpent) * 100) : 0;
              const barColor = CATEGORY_COLORS[cat] || '#64748b';

              return (
                <div key={cat} className="category-burn-item">
                  <div className="category-burn-meta">
                    <span className="category-burn-name">{cat}</span>
                    <span className="category-burn-amount">
                      {Math.round(amount).toLocaleString()} {baseCurrency} ({catPercent}%)
                    </span>
                  </div>
                  <div className="category-rail">
                    <div
                      className="category-rail-fill"
                      style={{
                        width: `${catPercent}%`,
                        backgroundColor: barColor,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripBudgetCard;
