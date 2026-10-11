import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Trash2, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDestinationImage } from '../utils/destinationImages';

const TripCard = ({ trip, onDelete }) => {
  const { currentUser } = useAuth();

  const ownerId = trip.owner?._id ? trip.owner._id.toString() : trip.owner?.toString();
  const currentUserId = currentUser?._id?.toString();
  const isOwner = ownerId === currentUserId;

  const formattedStart = new Date(trip.startDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const formattedEnd = new Date(trip.endDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const coverImg = useDestinationImage(trip.destination);

  return (
    <article className="trip-card-dribbble">
      {/* Visual Photo Header */}
      <div className="trip-card-media">
        <img
          src={coverImg}
          alt={trip.destination}
          className="trip-cover-img"
          loading="lazy"
        />
        <div className="trip-media-overlay"></div>

        {/* Floating Dribbble-style Destination Tag */}
        <div className="media-top-badges">
          <div className="trip-destination-pill-dribbble">
            <MapPin size={13} className="pin-icon" />
            <span>{trip.destination}</span>
          </div>

          <span className="currency-pill-glass">
            {trip.baseCurrency || 'USD'}
          </span>
        </div>

        {isOwner ? (
          <div className="badge-owner-glass">
            <Shield size={11} /> You own this
          </div>
        ) : (
          <div className="badge-owner-glass badge-invited-glass">
            <Users size={11} /> Invited • By {trip.owner?.name || 'Organizer'}
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="trip-card-body">
        <h3 className="trip-card-title">{trip.title}</h3>

        <div className="trip-meta-list">
          <div className="trip-meta-item">
            <Calendar size={14} className="meta-icon" />
            <span>{formattedStart} — {formattedEnd}</span>
          </div>

          <div className="trip-meta-item">
            <Users size={14} className="meta-icon" />
            <span>
              {trip.members?.length || 1} Traveler{trip.members?.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="trip-card-footer">
          <Link to={`/trips/${trip._id}`} className="btn btn-primary btn-sm open-trip-btn">
            <span>Open Workspace</span>
            <ArrowRight size={15} />
          </Link>

          {isOwner && onDelete && (
            <button
              type="button"
              className="btn btn-ghost btn-xs delete-trip-btn"
              onClick={() => onDelete(trip._id, trip.title)}
              title="Delete Trip"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default TripCard;
