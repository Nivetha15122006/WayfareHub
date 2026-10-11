/**
 * Calculates geographical distance in kilometers between two lat/lon coordinates
 * using the Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Estimates driving and walking time for a given distance in km
 */
export const estimateTransitTimes = (distanceKm) => {
  if (distanceKm == null) return null;

  // Average city driving speed: 30 km/h -> 2 mins per km + 2 min buffer
  const driveMinutes = Math.max(2, Math.round(distanceKm * 2 + 2));

  // Average walking speed: 4.8 km/h -> 12.5 mins per km
  const walkMinutes = Math.round(distanceKm * 12.5);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return {
    distanceKm,
    driveTime: formatTime(driveMinutes),
    walkTime: formatTime(walkMinutes),
  };
};
