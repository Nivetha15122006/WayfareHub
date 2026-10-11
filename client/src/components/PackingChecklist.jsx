import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, User, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const DEFAULT_PACKING_CATEGORIES = [
  'Documents & ID',
  'Electronics & Chargers',
  'Clothing & Apparel',
  'Medical & Pharmacy',
  'General Essentials',
];

const PackingChecklist = ({ trip, members = [], onTripUpdated }) => {
  const [items, setItems] = useState(trip?.packingList || []);
  const [newItemText, setNewItemText] = useState('');
  const [newCategory, setNewCategory] = useState('General Essentials');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  const allMembers = [
    trip.owner,
    ...(trip.members || []),
  ].filter(Boolean).filter((m, idx, arr) => arr.findIndex((x) => (x._id || x) === (m._id || m)) === idx);

  const saveList = async (newList) => {
    setItems(newList);
    setSaving(true);
    try {
      const res = await api.put(`/trips/${trip._id}`, { packingList: newList });
      if (res.data.success && onTripUpdated) {
        onTripUpdated(res.data.data);
      }
    } catch (err) {
      console.error('Failed to sync packing list:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItem = (index) => {
    const updated = items.map((item, idx) => {
      if (idx === index) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    saveList(updated);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const assignedMember = allMembers.find((m) => (m._id || m) === newAssignedTo);

    const newItem = {
      item: newItemText.trim(),
      category: newCategory,
      assignedTo: newAssignedTo || null,
      assignedToName: assignedMember?.name || '',
      completed: false,
    };

    const updated = [...items, newItem];
    setNewItemText('');
    saveList(updated);
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    saveList(updated);
  };

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const packedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = selectedCategoryFilter === 'All'
    ? items
    : items.filter((i) => i.category === selectedCategoryFilter);

  return (
    <div className="packing-checklist-panel">
      <div className="packing-panel-header">
        <div className="packing-title-wrap">
          <div className="packing-icon-box">
            <CheckSquare size={20} className="text-emerald" />
          </div>
          <div>
            <h3 className="packing-title">Collaborative Expedition Packing List</h3>
            <p className="packing-subtitle">
              Assign group essentials, prevent duplicate baggage, and track preparation progress
            </p>
          </div>
        </div>

        <div className="packing-progress-stats">
          <div className="packing-count-badge">
            <CheckCircle2 size={16} className={packedPercent === 100 ? 'text-emerald' : 'text-amber'} />
            <span>
              {completedCount} of {totalCount} Packed ({packedPercent}%)
            </span>
          </div>
          {saving && <span className="syncing-text">Syncing...</span>}
        </div>
      </div>

      {/* Progress Track */}
      {totalCount > 0 && (
        <div className="packing-progress-track">
          <div
            className="packing-progress-fill"
            style={{ width: `${packedPercent}%` }}
          ></div>
        </div>
      )}

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="packing-add-form">
        <input
          type="text"
          className="form-input packing-item-input"
          placeholder="e.g. Universal Travel Adapter, Passports, Sunscreen SPF 50"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          required
        />

        <select
          className="form-select packing-cat-select"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        >
          {DEFAULT_PACKING_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          className="form-select packing-member-select"
          value={newAssignedTo}
          onChange={(e) => setNewAssignedTo(e.target.value)}
        >
          <option value="">Assign To: Anyone</option>
          {allMembers.map((m) => (
            <option key={m._id || m} value={m._id || m}>
              {m.name || 'Member'}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary btn-sm add-item-btn">
          <Plus size={15} />
          <span>Add Item</span>
        </button>
      </form>

      {/* Category Filter Pills */}
      <div className="packing-filter-pills">
        {['All', ...DEFAULT_PACKING_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`packing-cat-pill ${selectedCategoryFilter === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      {filteredItems.length === 0 ? (
        <div className="empty-packing-box">
          <p className="empty-text">No items in this category yet. Add your travel gear above!</p>
        </div>
      ) : (
        <div className="packing-items-grid">
          {filteredItems.map((item, originalIdx) => {
            const actualIndex = items.indexOf(item);
            return (
              <div
                key={actualIndex}
                className={`packing-item-card ${item.completed ? 'is-completed' : ''}`}
              >
                <button
                  type="button"
                  className="packing-checkbox-btn"
                  onClick={() => handleToggleItem(actualIndex)}
                >
                  {item.completed ? (
                    <CheckSquare size={18} className="text-emerald" />
                  ) : (
                    <Square size={18} className="text-muted" />
                  )}
                </button>

                <div className="packing-item-details" onClick={() => handleToggleItem(actualIndex)}>
                  <span className={`packing-item-name ${item.completed ? 'strike' : ''}`}>
                    {item.item}
                  </span>
                  <div className="packing-item-tags">
                    <span className="packing-tag-cat">{item.category}</span>
                    {item.assignedToName && (
                      <span className="packing-tag-user">
                        <User size={11} /> {item.assignedToName}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="packing-delete-btn"
                  onClick={() => handleDeleteItem(actualIndex)}
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PackingChecklist;
