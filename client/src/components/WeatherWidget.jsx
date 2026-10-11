import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer, RefreshCw } from 'lucide-react';

const getWeatherIcon = (code) => {
  if (code === 0) return <Sun size={20} className="text-amber" />;
  if ([1, 2, 3].includes(code)) return <Cloud size={20} className="text-blue" />;
  if ([45, 48].includes(code)) return <Wind size={20} className="text-slate" />;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain size={20} className="text-cyan" />;
  if ([71, 73, 75, 85, 86].includes(code)) return <CloudSnow size={20} className="text-indigo" />;
  if ([95, 96, 99].includes(code)) return <CloudLightning size={20} className="text-rose" />;
  return <Sun size={20} className="text-amber" />;
};

const getWeatherDescription = (code) => {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55].includes(code)) return 'Light Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain Showers';
  if ([71, 73, 75].includes(code)) return 'Snowfall';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Fair Weather';
};

const WeatherWidget = ({ destination }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cityName = destination ? destination.split(',')[0].trim() : '';

  useEffect(() => {
    if (!cityName) return;
    let isMounted = true;

    const fetchWeather = async () => {
      setLoading(true);
      setError(false);
      try {
        // Step 1: Geocode city name to lat/lon via free Open-Meteo Geocoding
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
        );
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          if (isMounted) setError(true);
          return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // Step 2: Fetch 5-day daily forecast and current weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&timezone=auto`
        );
        const weatherJson = await weatherRes.json();

        if (isMounted && weatherJson.current_weather) {
          setWeatherData({
            cityName: name || cityName,
            country: country || '',
            current: weatherJson.current_weather,
            daily: weatherJson.daily,
          });
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [cityName]);

  if (error || (!loading && !weatherData)) return null;

  if (loading) {
    return (
      <div className="weather-pill-glass">
        <Thermometer size={14} className="animate-spin text-amber" />
        <span>Loading destination weather...</span>
      </div>
    );
  }

  const current = weatherData.current;
  const daily = weatherData.daily;

  return (
    <div className="weather-forecast-container">
      <div className="weather-current-badge">
        <div className="weather-icon-wrap">
          {getWeatherIcon(current.weathercode)}
        </div>
        <div className="weather-text-block">
          <div className="weather-temp-row">
            <span className="weather-temp-val">{Math.round(current.temperature)}°C</span>
            <span className="weather-desc">{getWeatherDescription(current.weathercode)}</span>
          </div>
          <span className="weather-location-sub">
            {weatherData.cityName}{weatherData.country ? `, ${weatherData.country}` : ''}
          </span>
        </div>
      </div>

      {daily && daily.time && (
        <div className="weather-mini-forecast">
          {daily.time.slice(0, 5).map((dateStr, idx) => {
            const dayLabel = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
            const code = daily.weathercode[idx];
            const max = Math.round(daily.temperature_2m_max[idx]);
            const min = Math.round(daily.temperature_2m_min[idx]);

            return (
              <div key={dateStr} className="forecast-day-chip" title={`${dayLabel}: ${getWeatherDescription(code)}`}>
                <span className="forecast-day-name">{dayLabel}</span>
                <span className="forecast-icon">{getWeatherIcon(code)}</span>
                <span className="forecast-temp-range">{max}° / {min}°</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
