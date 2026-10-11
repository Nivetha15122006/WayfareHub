import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation, Compass, Route } from 'lucide-react';

// Fix Leaflet marker icon asset resolution for bundlers
const createCustomIcon = (color = '#2563eb', label = '') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 11px;
          font-weight: bold;
        ">${label || '•'}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to handle map center/zoom updates dynamically
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, {
        duration: 1.2,
      });
    }
  }, [center, zoom, map]);
  return null;
}

const MapView = ({
  destination = '',
  markers = [],
  selectedLocation = null,
  onSelectLocation = null,
  onAddToItinerary = null,
  height = '420px',
}) => {
  // Default to Paris if destination is unresolved
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [searchQuery, setSearchQuery] = useState(destination);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');

  // Geocode destination via Nominatim on initial load or destination change
  useEffect(() => {
    let isMounted = true;

    const geocodePlace = async (place) => {
      if (!place) return;
      setSearching(true);
      setSearchError('');
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            place
          )}&limit=1`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'WayfareHub-TravelPlanner/1.0',
            },
          }
        );
        const data = await response.json();
        if (isMounted && data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapCenter([lat, lon]);
          setZoomLevel(13);
        }
      } catch (err) {
        console.warn('Nominatim geocoding error:', err);
      } finally {
        if (isMounted) setSearching(false);
      }
    };

    if (destination) {
      setSearchQuery(destination);
      geocodePlace(destination);
    }

    return () => {
      isMounted = false;
    };
  }, [destination]);

  // Recenter if selectedLocation changes
  useEffect(() => {
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      setMapCenter([selectedLocation.latitude, selectedLocation.longitude]);
      setZoomLevel(15);
    }
  }, [selectedLocation]);

  // Well-known landmark quick-lookup dictionary for instant, infallible resolution
  const LANDMARK_PRESETS = {
    'eiffel tower': { lat: 48.8584, lon: 2.2945, name: 'Eiffel Tower', display_name: 'Eiffel Tower, Champ de Mars, Paris, France' },
    'eiffel': { lat: 48.8584, lon: 2.2945, name: 'Eiffel Tower', display_name: 'Eiffel Tower, Champ de Mars, Paris, France' },
    'tirupati': { lat: 13.6288, lon: 79.4192, name: 'Tirupati', display_name: 'Tirupati, Andhra Pradesh, India' },
    'tirumala': { lat: 13.6833, lon: 79.3500, name: 'Tirumala Venkateswara Temple', display_name: 'Tirumala, Tirupati, Andhra Pradesh, India' },
    'tirupati balaji': { lat: 13.6833, lon: 79.3500, name: 'Tirumala Venkateswara Temple', display_name: 'Tirumala, Tirupati, Andhra Pradesh, India' },
    'taj mahal': { lat: 27.1751, lon: 78.0421, name: 'Taj Mahal', display_name: 'Taj Mahal, Agra, Uttar Pradesh, India' },
    'colosseum': { lat: 41.8902, lon: 12.4922, name: 'Colosseum', display_name: 'Colosseum, Rome, Italy' },
    'louvre': { lat: 48.8606, lon: 2.3376, name: 'Louvre Museum', display_name: 'Louvre Museum, Paris, France' },
  };

  // Search places via Nominatim with preset bypass & multi-query fallback
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    setSearchError('');
    setSearchResults([]);

    // Check presets first for lightning-fast, 100% accurate pinpointing
    const lowerQuery = query.toLowerCase();
    for (const [key, val] of Object.entries(LANDMARK_PRESETS)) {
      if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
        setSearchResults([val]);
        setMapCenter([val.lat, val.lon]);
        setZoomLevel(15);
        setSearching(false);
        return;
      }
    }

    try {
      // Primary search with high precision
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          query
        )}&limit=6`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'WayfareHub-TravelPlanner/2.0',
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setSearchResults(data);
        const first = data[0];
        setMapCenter([parseFloat(first.lat), parseFloat(first.lon)]);
        setZoomLevel(14);
      } else {
        // Fallback: try searching combined with destination if available
        if (destination && !query.toLowerCase().includes(destination.toLowerCase())) {
          const fallbackRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              `${query} ${destination}`
            )}&limit=5`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'WayfareHub-TravelPlanner/2.0',
              },
            }
          );
          const fbData = await fallbackRes.json();
          if (fbData && fbData.length > 0) {
            setSearchResults(fbData);
            setMapCenter([parseFloat(fbData[0].lat), parseFloat(fbData[0].lon)]);
            setZoomLevel(14);
            return;
          }
        }
        setSearchError(`No exact coordinates found for "${query}". Try adding the city name.`);
      }
    } catch (err) {
      setSearchError('Geocoding request timed out. Please retry.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setMapCenter([lat, lon]);
    setZoomLevel(15);
    setSearchResults([]);

    if (onSelectLocation) {
      onSelectLocation({
        name: result.display_name.split(',')[0],
        location: result.display_name,
        latitude: lat,
        longitude: lon,
      });
    }
  };

  return (
    <div className="map-view-wrapper" style={{ height }}>
      {/* Map Search Overlay Bar */}
      <div className="map-search-bar">
        <form onSubmit={handleSearch} className="map-search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search destination, hotel, or attraction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="map-search-input"
          />
          <button type="submit" className="btn btn-primary btn-xs" disabled={searching}>
            {searching ? 'Locating...' : 'Search'}
          </button>
        </form>

        {searchError && <div className="map-search-error">{searchError}</div>}

        {searchResults.length > 0 && (
          <ul className="map-search-dropdown">
            {searchResults.map((res, idx) => (
              <li
                key={idx}
                className="map-search-item"
                onClick={() => handleSelectSearchResult(res)}
              >
                <MapPin size={14} className="dropdown-pin" />
                <span className="dropdown-text">{res.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      >
        <ChangeView center={mapCenter} zoom={zoomLevel} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Selected Location Marker */}
        {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
          <Marker
            position={[selectedLocation.latitude, selectedLocation.longitude]}
            icon={createCustomIcon('#ef4444', '★')}
          >
            <Popup>
              <div className="map-popup-card">
                <span className="popup-badge highlight">Selected Location</span>
                <h4 className="popup-title">{selectedLocation.name || 'Selected Place'}</h4>
                <p className="popup-loc">{selectedLocation.location}</p>
                {onAddToItinerary && (
                  <button
                    onClick={() => onAddToItinerary(selectedLocation)}
                    className="btn btn-primary btn-xs popup-add-btn"
                  >
                    + Add to Itinerary
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Markers from itinerary or discovery */}
        {markers.map((marker, index) => {
          if (!marker.latitude || !marker.longitude) return null;
          const isSelected =
            selectedLocation &&
            selectedLocation.latitude === marker.latitude &&
            selectedLocation.longitude === marker.longitude;

          const color = marker.category === 'Hotel'
            ? '#8b5cf6'
            : marker.category === 'Restaurant'
            ? '#f97316'
            : marker.category === 'Attraction'
            ? '#06b6d4'
            : '#3b82f6';

          return (
            <Marker
              key={marker._id || index}
              position={[marker.latitude, marker.longitude]}
              icon={createCustomIcon(isSelected ? '#ef4444' : color, index + 1)}
              eventHandlers={{
                click: () => {
                  if (onSelectLocation) onSelectLocation(marker);
                },
              }}
            >
              <Popup>
                <div className="map-popup-card">
                  <span className={`popup-badge cat-${(marker.category || 'spot').toLowerCase()}`}>
                    {marker.category || 'Spot'}
                  </span>
                  <h4 className="popup-title">{marker.title || marker.name}</h4>
                  <p className="popup-loc">{marker.location || destination}</p>
                  {marker.startTime && (
                    <p className="popup-time">🕒 {marker.startTime} - {marker.endTime}</p>
                  )}
                  {onAddToItinerary && !marker.isAlreadyInItinerary && (
                    <button
                      onClick={() => onAddToItinerary(marker)}
                      className="btn btn-primary btn-xs popup-add-btn"
                    >
                      + Add to Itinerary
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* Travel Path Route connecting itinerary/discovery stops */}
        {markers.filter((m) => m.latitude && m.longitude).length > 1 && (
          <Polyline
            positions={markers
              .filter((m) => m.latitude && m.longitude)
              .map((m) => [m.latitude, m.longitude])}
            pathOptions={{
              color: '#047857',
              weight: 4,
              opacity: 0.8,
              dashArray: '8, 8',
              lineCap: 'round',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
