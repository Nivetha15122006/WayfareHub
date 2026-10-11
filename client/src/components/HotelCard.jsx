import React from 'react';
import { Star, MapPin, Plus, BedDouble, Navigation } from 'lucide-react';
import { getPlaceImage } from '../utils/destinationImages';

const HotelCard = ({ hotel, isSelected, onSelect, onAddToItinerary }) => {
  const thumbUrl = hotel.image || getPlaceImage('hotel', hotel.name?.length || 0);

  return (
    <article
      className={`place-card-dribbble hotel-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(hotel)}
    >
      <div className="card-media-thumb">
        <img src={thumbUrl} alt={hotel.name} className="place-thumb-img" loading="lazy" />
        <span className="card-category-badge hotel-badge">
          <BedDouble size={12} />
          <span>{hotel.category || 'Hotel'}</span>
        </span>
      </div>

      <div className="card-info-wrap">
        <div className="card-header-content">
          <h4 className="place-title">{hotel.name}</h4>
          <div className="place-rating">
            <Star size={13} className="star-icon filled" />
            <span>{hotel.rating ? hotel.rating.toFixed(1) : '4.8'}</span>
          </div>
        </div>

        <div className="place-location-row">
          <MapPin size={13} className="pin-icon" />
          <span className="location-text">{hotel.location?.split(',')[0] || 'Downtown'}</span>
        </div>

        <div className="card-footer-row">
          <div className="price-tag">
            <span className="price-label">From </span>
            <span className="price-value">{hotel.price || '$$$'}</span>
          </div>

          <div className="card-action-btns">
            <button
              type="button"
              className="btn btn-secondary btn-xs locate-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(hotel);
              }}
              title="Locate on map"
            >
              <Navigation size={12} />
              <span>Map</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-xs add-itinerary-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddToItinerary && onAddToItinerary(hotel);
              }}
            >
              <Plus size={12} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default HotelCard;
