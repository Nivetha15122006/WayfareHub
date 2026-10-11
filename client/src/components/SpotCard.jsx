import React from 'react';
import { Star, MapPin, Plus, Compass, Utensils, Landmark, Navigation } from 'lucide-react';
import { getPlaceImage } from '../utils/destinationImages';

const SpotCard = ({ spot, isSelected, onSelect, onAddToItinerary }) => {
  const getCategoryIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'restaurant':
        return <Utensils size={12} />;
      case 'attraction':
      case 'landmark':
        return <Landmark size={12} />;
      default:
        return <Compass size={12} />;
    }
  };

  const thumbUrl = spot.image || getPlaceImage(spot.category, spot.name?.length || 0);

  return (
    <article
      className={`place-card-dribbble spot-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(spot)}
    >
      <div className="card-media-thumb">
        <img src={thumbUrl} alt={spot.name} className="place-thumb-img" loading="lazy" />
        <span className={`card-category-badge spot-badge cat-${(spot.category || 'spot').toLowerCase()}`}>
          {getCategoryIcon(spot.category)}
          <span>{spot.category || 'Attraction'}</span>
        </span>
      </div>

      <div className="card-info-wrap">
        <div className="card-header-content">
          <h4 className="place-title">{spot.name}</h4>
          <div className="place-rating">
            <Star size={13} className="star-icon filled" />
            <span>{spot.rating ? spot.rating.toFixed(1) : '4.9'}</span>
          </div>
        </div>

        <div className="place-location-row">
          <MapPin size={13} className="pin-icon" />
          <span className="location-text">{spot.location?.split(',')[0] || 'Local Spot'}</span>
        </div>

        <div className="card-footer-row">
          <div className="price-tag">
            <span className="price-label">{spot.price || 'Free admission'}</span>
          </div>

          <div className="card-action-btns">
            <button
              type="button"
              className="btn btn-secondary btn-xs locate-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(spot);
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
                onAddToItinerary && onAddToItinerary(spot);
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

export default SpotCard;
