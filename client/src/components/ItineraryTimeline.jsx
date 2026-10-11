import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Navigation,
  Utensils,
  BedDouble,
  Landmark,
  Compass,
  FileText,
} from 'lucide-react';
import { calculateDistanceKm, estimateTransitTimes } from '../utils/geoDistance';

const CATEGORIES = ['Hotel', 'Attraction', 'Restaurant', 'Transport', 'Activity', 'Shopping', 'Other'];

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'hotel':
      return <BedDouble size={14} />;
    case 'restaurant':
      return <Utensils size={14} />;
    case 'attraction':
    case 'landmark':
      return <Landmark size={14} />;
    default:
      return <Compass size={14} />;
  }
};

const ItineraryTimeline = ({
  itinerary = [],
  tripStartDate,
  onAddStop,
  onUpdateStop,
  onDeleteStop,
  onLocateOnMap,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [date, setDate] = useState(
    tripStartDate ? new Date(tripStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [category, setCategory] = useState('Activity');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = (defaultDate = null) => {
    setEditingStop(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setLatitude('');
    setLongitude('');
    setDate(defaultDate || (tripStartDate ? new Date(tripStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
    setStartTime('09:00');
    setEndTime('11:00');
    setCategory('Activity');
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (stop) => {
    setEditingStop(stop);
    setTitle(stop.title || '');
    setDescription(stop.description || '');
    setLocation(stop.location || '');
    setLatitude(stop.latitude != null ? String(stop.latitude) : '');
    setLongitude(stop.longitude != null ? String(stop.longitude) : '');
    setDate(stop.date ? new Date(stop.date).toISOString().split('T')[0] : '');
    setStartTime(stop.startTime || '09:00');
    setEndTime(stop.endTime || '11:00');
    setCategory(stop.category || 'Activity');
    setNotes(stop.notes || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!date) {
      setFormError('Date is required');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      date,
      startTime,
      endTime,
      category,
      notes: notes.trim(),
    };

    let result;
    if (editingStop) {
      result = await onUpdateStop(editingStop._id, payload);
    } else {
      result = await onAddStop(payload);
    }

    if (result && !result.success) {
      setFormError(result.error || 'Failed to save itinerary stop');
    } else {
      setModalOpen(false);
    }
  };

  // Group stops by date
  const groupedByDate = itinerary.reduce((acc, stop) => {
    const d = stop.date ? stop.date.split('T')[0] : 'Unscheduled';
    if (!acc[d]) acc[d] = [];
    acc[d].push(stop);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedByDate).sort();

  // Sort stops within each date by startTime
  sortedDates.forEach((d) => {
    groupedByDate[d].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  });

  return (
    <div className="itinerary-timeline-wrapper">
      <div className="itinerary-header-bar">
        <div className="itinerary-title-box">
          <Calendar className="header-icon" size={20} />
          <h3 className="section-title">Trip Itinerary</h3>
          <span className="stops-count-badge">{itinerary.length} Stops</span>
        </div>
        <button
          type="button"
          onClick={() => openAddModal()}
          className="btn btn-primary btn-sm add-stop-btn"
        >
          <Plus size={16} />
          <span>Add Stop</span>
        </button>
      </div>

      {itinerary.length === 0 ? (
        <div className="empty-itinerary-card">
          <Calendar size={40} className="empty-icon" />
          <h4>No Itinerary Stops Yet</h4>
          <p>
            Start mapping out your journey by adding places, hotel check-ins, attractions, or dining spots.
          </p>
          <button
            type="button"
            onClick={() => openAddModal()}
            className="btn btn-primary btn-sm"
          >
            <Plus size={15} /> Add First Stop
          </button>
        </div>
      ) : (
        <div className="timeline-days-stack">
          {sortedDates.map((dateKey, dayIdx) => {
            const stopsForDay = groupedByDate[dateKey];
            const displayDate =
              dateKey !== 'Unscheduled'
                ? new Date(dateKey + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Unscheduled Stops';

            return (
              <div key={dateKey} className="timeline-day-block">
                <div className="timeline-day-header">
                  <div className="day-number-badge">Day {dayIdx + 1}</div>
                  <h4 className="day-date-title">{displayDate}</h4>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs add-day-stop-btn"
                    onClick={() => openAddModal(dateKey)}
                  >
                    <Plus size={14} /> Add to Day
                  </button>
                </div>

                <div className="timeline-stops-list">
                  {stopsForDay.map((stop, idx) => {
                    const nextStop = stopsForDay[idx + 1];
                    let transitInfo = null;
                    if (
                      nextStop &&
                      stop.latitude != null &&
                      stop.longitude != null &&
                      nextStop.latitude != null &&
                      nextStop.longitude != null
                    ) {
                      const dist = calculateDistanceKm(
                        stop.latitude,
                        stop.longitude,
                        nextStop.latitude,
                        nextStop.longitude
                      );
                      if (dist != null && dist > 0.05) {
                        transitInfo = estimateTransitTimes(dist);
                      }
                    }

                    return (
                      <React.Fragment key={stop._id}>
                        <div className="timeline-stop-item">
                          <div className="timeline-marker-column">
                            <div className={`timeline-stop-node cat-${(stop.category || 'other').toLowerCase()}`}>
                              {getCategoryIcon(stop.category)}
                            </div>
                            <div className="timeline-connector-line"></div>
                          </div>

                          <div className="timeline-stop-content">
                            <div className="stop-header-row">
                              <div className="stop-time-badge">
                                <Clock size={13} />
                                <span>{stop.startTime || '09:00'} - {stop.endTime || '10:00'}</span>
                              </div>
                              <span className={`stop-category-tag cat-${(stop.category || 'other').toLowerCase()}`}>
                                {stop.category || 'Activity'}
                              </span>
                              <div className="stop-actions">
                                {stop.latitude && stop.longitude && onLocateOnMap && (
                                  <button
                                    type="button"
                                    className="action-icon-btn locate-icon-btn"
                                    onClick={() => onLocateOnMap(stop)}
                                    title="Show on map"
                                  >
                                    <Navigation size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="action-icon-btn edit-icon-btn"
                                  onClick={() => openEditModal(stop)}
                                  title="Edit stop"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon-btn delete-icon-btn"
                                  onClick={() => onDeleteStop(stop._id)}
                                  title="Delete stop"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <h5 className="stop-title">{stop.title}</h5>

                            {stop.description && (
                              <p className="stop-description">{stop.description}</p>
                            )}

                            {stop.location && (
                              <div className="stop-location">
                                <MapPin size={13} />
                                <span>{stop.location}</span>
                              </div>
                            )}

                            {stop.notes && (
                              <div className="stop-notes">
                                <FileText size={12} />
                                <span>Note: {stop.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {transitInfo && (
                          <div className="timeline-transit-connector">
                            <div className="transit-indicator-pill">
                              <Navigation size={12} className="transit-icon" />
                              <span className="transit-dist">{transitInfo.distanceKm} km</span>
                              <span className="transit-dot">•</span>
                              <span className="transit-drive">🚗 ~{transitInfo.driveTime} drive</span>
                              <span className="transit-dot">•</span>
                              <span className="transit-walk">🚶 ~{transitInfo.walkTime} walk</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Stop Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingStop ? 'Edit Itinerary Stop' : 'Add Itinerary Stop'}</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>

            {formError && <div className="form-error-alert">{formError}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Stop Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Louvre Museum Visit, Breakfast at Cafe, Beach Walk"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rue de Rivoli, 75001 Paris"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Details about what to do or see..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Tickets, Reservation #, etc.)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Booking ref #X9402, arrive 15 mins early"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStop ? 'Save Changes' : 'Add Stop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryTimeline;
