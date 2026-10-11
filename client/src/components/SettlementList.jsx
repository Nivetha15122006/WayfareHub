import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, TrendingDown, TrendingUp, Scale, Wallet, Check, CheckSquare, Square, History } from 'lucide-react';

const SettlementList = ({
  settlements = [],
  balances = [],
  baseCurrency = 'USD',
  totalSpending = 0,
  onSettlePayment = null,
  tripId = '',
}) => {
  const [settlingIndex, setSettlingIndex] = useState(null);
  const [justSettled, setJustSettled] = useState([]);

  const handleTickPayment = async (item, index) => {
    if (!onSettlePayment || settlingIndex !== null) return;
    setSettlingIndex(index);
    try {
      const res = await onSettlePayment(tripId, {
        from: item.from,
        fromId: item.fromId,
        to: item.to,
        toId: item.toId,
        amount: item.amount,
        currency: item.currency || baseCurrency,
      });
      if (res?.success) {
        setJustSettled((prev) => [...prev, `${item.from}-${item.to}-${item.amount}`]);
      }
    } catch (err) {
      console.error('Error ticking settlement:', err);
    } finally {
      setSettlingIndex(null);
    }
  };

  return (
    <div className="settlement-container">
      {/* Financial Summary Header */}
      <div className="settlement-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap bg-blue">
            <Wallet size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Trip Expenses</span>
            <h4 className="stat-value">{totalSpending.toFixed(2)} {baseCurrency}</h4>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap bg-green">
            <Scale size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Pending Transfers</span>
            <h4 className="stat-value">{settlements.length} Transfers</h4>
          </div>
        </div>
      </div>

      {/* Member Obligations Breakdown (Who needs to pay, how much completed, to whom) */}
      <div className="balances-section">
        <h4 className="section-subheading">Member Expense & Payment Obligations</h4>
        {balances.length === 0 ? (
          <p className="empty-subtext">No balance data available yet.</p>
        ) : (
          <div className="balances-grid">
            {balances.map((b, idx) => {
              const netVal = typeof b?.net === 'number' ? b.net : 0;
              const paidVal = typeof b?.paid === 'number' ? b.paid : 0;
              const owedVal = typeof b?.owed === 'number' ? b.owed : 0;
              const isPositive = netVal > 0.01;
              const isNegative = netVal < -0.01;

              // Find who this member owes or receives from in the greedy plan
              const outgoingTransfers = settlements.filter((s) => (s.fromId && s.fromId === b.id) || s.from === b.name);
              const incomingTransfers = settlements.filter((s) => (s.toId && s.toId === b.id) || s.to === b.name);

              return (
                <div key={b?.id || idx} className="balance-card">
                  <div className="balance-card-top">
                    <div className="balance-user-info">
                      <span className="user-name">{b?.name || 'Member'}</span>
                      <span className="user-paid-owed">
                        Spent: {paidVal.toFixed(2)} | Share: {owedVal.toFixed(2)} {baseCurrency}
                      </span>
                    </div>
                    <div className={`balance-tag ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                      {isPositive && <TrendingUp size={14} />}
                      {isNegative && <TrendingDown size={14} />}
                      <span>
                        {isPositive ? `+${netVal.toFixed(2)}` : netVal.toFixed(2)} {baseCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Status / Breakdown text */}
                  <div className="balance-obligation-details">
                    {isNegative ? (
                      <div className="obligation-tag owes-tag">
                        ⚠️ Needs to pay: <strong>{Math.abs(netVal).toFixed(2)} {baseCurrency}</strong>
                        {outgoingTransfers.length > 0 && (
                          <span className="recipient-hint">
                            {' '}(to {outgoingTransfers.map((s) => `${s.to} [${s.amount.toFixed(2)}]`).join(', ')})
                          </span>
                        )}
                      </div>
                    ) : isPositive ? (
                      <div className="obligation-tag receives-tag">
                        ✨ To receive: <strong>{netVal.toFixed(2)} {baseCurrency}</strong>
                        {incomingTransfers.length > 0 && (
                          <span className="recipient-hint">
                            {' '}(from {incomingTransfers.map((s) => `${s.from} [${s.amount.toFixed(2)}]`).join(', ')})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="obligation-tag settled-tag">
                        ✅ Completely squared away (0.00 {baseCurrency})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simplified Debts List with Tick / Checkbox to Mark as Paid */}
      <div className="settlements-section">
        <div className="settlements-header-wrap">
          <h4 className="section-subheading">Greedy Debt Simplification & Settlement Plan</h4>
          <span className="section-help-pill">Tick when paid to automatically update net balances</span>
        </div>

        {settlements.length === 0 ? (
          <div className="empty-settlements-state">
            <CheckCircle2 size={32} className="all-settled-icon" />
            <p className="all-settled-title">All Debts Fully Settled!</p>
            <p className="all-settled-desc">Everyone is squared away. No pending transfers remain.</p>
          </div>
        ) : (
          <div className="settlements-list">
            {settlements.map((item, index) => {
              const isProcessing = settlingIndex === index;
              return (
                <div key={index} className="settlement-row tickable-settlement-row">
                  <div className="settlement-party from-party">
                    <span className="party-badge debtor-badge">Owes</span>
                    <strong className="party-name">{item.from}</strong>
                  </div>

                  <div className="settlement-arrow-block">
                    <span className="transfer-amount">
                      {typeof item?.amount === 'number' ? item.amount.toFixed(2) : (item?.amount || '0.00')} {item?.currency || baseCurrency}
                    </span>
                    <div className="arrow-line">
                      <ArrowRight size={16} />
                    </div>
                  </div>

                  <div className="settlement-party to-party">
                    <span className="party-badge creditor-badge">Receives</span>
                    <strong className="party-name">{item.to}</strong>
                  </div>

                  {/* Mark as Paid Tick Button */}
                  <div className="settlement-action-cell">
                    <button
                      type="button"
                      className={`btn-tick-settle ${isProcessing ? 'loading' : ''}`}
                      onClick={() => handleTickPayment(item, index)}
                      disabled={isProcessing}
                      title={`Click to confirm ${item.from} paid ${item.to}`}
                    >
                      <Check size={14} className="tick-icon" />
                      <span>{isProcessing ? 'Updating...' : 'Mark as Paid'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementList;
