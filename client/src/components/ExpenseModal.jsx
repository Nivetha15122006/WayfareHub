import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calculator, AlertCircle, RefreshCw, Camera, UploadCloud, Check } from 'lucide-react';
import api from '../services/api';

const CURRENCIES = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'CHF', 'NZD', 'THB', 'AED'];
const CATEGORIES = [
  'Accommodation',
  'Food',
  'Transportation',
  'Activities',
  'Shopping',
  'Flights',
  'Miscellaneous',
];

const ExpenseModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  trip,
  members = [],
}) => {
  if (!isOpen) return null;

  const baseCurrency = trip?.baseCurrency || 'USD';

  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [currency, setCurrency] = useState(initialData?.currency || baseCurrency);
  const [paidBy, setPaidBy] = useState(
    initialData?.paidBy?._id || initialData?.paidBy || members[0]?._id || ''
  );
  const [splitType, setSplitType] = useState(initialData?.splitType || 'equal');
  const [category, setCategory] = useState(initialData?.category || 'Food');
  const [date, setDate] = useState(
    initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [receiptImage, setReceiptImage] = useState(initialData?.receiptImage || null);

  // Participant allocations: map of userId -> { selected: boolean, percentage: number, customAmount: number }
  const [participantState, setParticipantState] = useState(() => {
    const state = {};
    const existingParticipants = initialData?.participants || [];
    members.forEach((m) => {
      const existing = existingParticipants.find((p) => (p.user?._id || p.user) === m._id);
      state[m._id] = {
        selected: existing ? true : true, // default all selected
        percentage: existing?.percentage || Math.round(100 / (members.length || 1)),
        customAmount: existing?.customAmount || '',
      };
    });
    return state;
  });

  const [liveFxRate, setLiveFxRate] = useState(initialData?.exchangeRate || 1.0);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch FX conversion rate when currency changes
  useEffect(() => {
    let isMounted = true;
    const fetchRate = async () => {
      if (currency === baseCurrency) {
        setLiveFxRate(1.0);
        return;
      }
      setFetchingRate(true);
      try {
        const res = await api.get(`/fx/rate?from=${currency}&to=${baseCurrency}`);
        if (isMounted && res.data.success) {
          setLiveFxRate(res.data.data.rate);
        }
      } catch (err) {
        console.warn('FX rate fetch error:', err);
      } finally {
        if (isMounted) setFetchingRate(false);
      }
    };

    fetchRate();
    return () => {
      isMounted = false;
    };
  }, [currency, baseCurrency]);

  const numAmount = parseFloat(amount) || 0;
  const estimatedConverted = Math.round(numAmount * liveFxRate * 100) / 100;

  // Selected participants list
  const selectedMembers = members.filter((m) => participantState[m._id]?.selected);

  // Participant toggles and allocation handlers
  const handleToggleMember = (userId) => {
    setParticipantState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        selected: !prev[userId]?.selected,
      },
    }));
  };

  const handlePercentageChange = (userId, value) => {
    setParticipantState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        percentage: value,
      },
    }));
  };

  const handleCustomAmountChange = (userId, value) => {
    setParticipantState((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        customAmount: value,
      },
    }));
  };

  // Calculations for validations
  const totalPercentage = selectedMembers.reduce(
    (sum, m) => sum + (parseFloat(participantState[m._id]?.percentage) || 0),
    0
  );

  const totalCustomAmount = selectedMembers.reduce(
    (sum, m) => sum + (parseFloat(participantState[m._id]?.customAmount) || 0),
    0
  );

  const handleReceiptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Receipt image must be smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setReceiptImage(base64);

      // Quick auto-amount detection if filename has numbers
      if (!amount) {
        const match = file.name.match(/\b\d+(\.\d{1,2})?\b/);
        if (match && match[0]) {
          setAmount(match[0]);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim()) {
      setFormError('Please enter an expense description.');
      return;
    }

    if (numAmount <= 0) {
      setFormError('Expense amount must be greater than zero.');
      return;
    }

    if (!paidBy) {
      setFormError('Please select who paid for this expense.');
      return;
    }

    if (selectedMembers.length === 0) {
      setFormError('Please select at least one participant.');
      return;
    }

    // Split validation
    let participantsPayload = [];
    if (splitType === 'equal') {
      participantsPayload = selectedMembers.map((m) => ({
        user: m._id,
      }));
    } else if (splitType === 'percentage') {
      if (Math.abs(totalPercentage - 100) > 0.5) {
        setFormError(`Participant percentages must equal 100%. Currently: ${totalPercentage}%`);
        return;
      }
      participantsPayload = selectedMembers.map((m) => ({
        user: m._id,
        percentage: parseFloat(participantState[m._id]?.percentage) || 0,
      }));
    } else if (splitType === 'custom') {
      // Allow custom amounts matching either original amount or converted amount
      const matchesOriginal = Math.abs(totalCustomAmount - numAmount) < 0.1;
      const matchesConverted = Math.abs(totalCustomAmount - estimatedConverted) < 0.1;

      if (!matchesOriginal && !matchesConverted) {
        setFormError(
          `Custom split total (${totalCustomAmount}) must equal the expense total (${numAmount} ${currency}).`
        );
        return;
      }
      participantsPayload = selectedMembers.map((m) => ({
        user: m._id,
        customAmount: parseFloat(participantState[m._id]?.customAmount) || 0,
      }));
    }

    setSubmitting(true);
    const payload = {
      trip: trip._id,
      description: description.trim(),
      amount: numAmount,
      currency,
      paidBy,
      splitType,
      participants: participantsPayload,
      category,
      date,
      notes,
      receiptImage,
    };

    const res = await onSubmit(payload);
    setSubmitting(false);

    if (res && !res.success) {
      setFormError(res.error || 'Failed to save expense');
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window expense-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <DollarSign className="modal-title-icon" size={22} />
            <h3 className="modal-title">{initialData ? 'Edit Expense' : 'Add New Expense'}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {formError && (
          <div className="form-error-alert">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dinner at Le Bistro, Train tickets, Hotel stay"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label className="form-label">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Currency *</label>
              <select
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-2">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FX Conversion Badge */}
          {currency !== baseCurrency && (
            <div className="fx-info-card">
              <div className="fx-info-header">
                <RefreshCw size={14} className={fetchingRate ? 'spin-icon' : ''} />
                <span>Multi-Currency FX Conversion (via Frankfurter API)</span>
              </div>
              <div className="fx-rate-calc">
                <span>1 {currency} ≈ {liveFxRate} {baseCurrency}</span>
                <span className="fx-arrow">➜</span>
                <strong>Converted Amount: {estimatedConverted} {baseCurrency}</strong>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Paid By *</label>
              <select
                className="form-select"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Split Mode Selector */}
          <div className="form-group">
            <label className="form-label">Split Method *</label>
            <div className="split-mode-selector">
              <button
                type="button"
                className={`split-tab ${splitType === 'equal' ? 'active' : ''}`}
                onClick={() => setSplitType('equal')}
              >
                Equal Split
              </button>
              <button
                type="button"
                className={`split-tab ${splitType === 'percentage' ? 'active' : ''}`}
                onClick={() => setSplitType('percentage')}
              >
                Percentage Split
              </button>
              <button
                type="button"
                className={`split-tab ${splitType === 'custom' ? 'active' : ''}`}
                onClick={() => setSplitType('custom')}
              >
                Custom Exact
              </button>
            </div>
          </div>

          {/* Participant Allocations UI */}
          <div className="split-allocation-box">
            <div className="allocation-box-header">
              <span className="box-title">Participants & Share ({selectedMembers.length}/{members.length})</span>
              {splitType === 'equal' && selectedMembers.length > 0 && (
                <span className="share-preview">
                  ≈ {(estimatedConverted / selectedMembers.length).toFixed(2)} {baseCurrency} each
                </span>
              )}
              {splitType === 'percentage' && (
                <span className={`share-preview ${Math.abs(totalPercentage - 100) > 0.1 ? 'warning' : 'success'}`}>
                  Total: {totalPercentage}% / 100%
                </span>
              )}
              {splitType === 'custom' && (
                <span className={`share-preview ${Math.abs(totalCustomAmount - numAmount) > 0.1 ? 'warning' : 'success'}`}>
                  Total: {totalCustomAmount} / {numAmount} {currency}
                </span>
              )}
            </div>

            <div className="participants-list">
              {members.map((member) => {
                const isSelected = participantState[member._id]?.selected;
                return (
                  <div key={member._id} className={`participant-row ${isSelected ? 'included' : 'excluded'}`}>
                    <label className="participant-check-label">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleMember(member._id)}
                      />
                      <span className="member-name-text">{member.name}</span>
                    </label>

                    {isSelected && splitType === 'percentage' && (
                      <div className="input-with-addon">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={participantState[member._id]?.percentage}
                          onChange={(e) => handlePercentageChange(member._id, e.target.value)}
                          className="split-subinput"
                        />
                        <span className="addon">%</span>
                      </div>
                    )}

                    {isSelected && splitType === 'custom' && (
                      <div className="input-with-addon">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={participantState[member._id]?.customAmount}
                          onChange={(e) => handleCustomAmountChange(member._id, e.target.value)}
                          className="split-subinput"
                        />
                        <span className="addon">{currency}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Receipt #1042 or split agreement details"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Receipt Photo Upload & Bill Inspector */}
          <div className="form-group receipt-upload-group">
            <label className="form-label">
              <Camera size={14} className="inline-icon" /> Bill / Receipt Photo (Optional)
            </label>
            {receiptImage ? (
              <div className="receipt-preview-box">
                <img src={receiptImage} alt="Receipt preview" className="receipt-preview-thumb" />
                <div className="receipt-preview-actions">
                  <span className="receipt-attached-badge">
                    <Check size={12} /> Receipt attached
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-rose"
                    onClick={() => setReceiptImage(null)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="receipt-dropzone">
                <input
                  type="file"
                  id="receipt-file-input"
                  accept="image/*"
                  className="receipt-file-input"
                  onChange={handleReceiptFileChange}
                />
                <label htmlFor="receipt-file-input" className="receipt-dropzone-label">
                  <UploadCloud size={18} className="text-muted" />
                  <span>Attach bill or receipt photo (Max 5MB)</span>
                </label>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : initialData ? 'Update Expense' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
