import {storage} from '../../storage.js';
import { useT } from "../../i18n.jsx";
import React, { useRef, useState, useEffect } from 'react';
import { CloudSun, MapPin, Search, RefreshCw, Wind, Droplets, Sun, CloudRain, CloudSnow, CloudLightning, Cloud } from 'lucide-react';
import { fetchJSON, useRemoteData } from '../../hooks/useRemoteData.js';
import { describeWeather, parseWeather, validForecastCache } from '../../liveData.js';
import { readStored } from '../../study.js';
import s from './Workspace.module.css';
import f from './World.module.css';
const DEFAULT_LOCATION = {
  name: 'Neuss',
  country: 'Germany',
  latitude: 51.1981,
  longitude: 6.685
};
function savedLocation() {
  const v = readStored('aster-weather-location', DEFAULT_LOCATION);
  return v && typeof v.name === 'string' && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180 ? v : DEFAULT_LOCATION;
}
export function WeatherIcon({
  code,
  size = 24
}) {
  const tr = useT();
  const Icon = code === 0 ? Sun : [1, 2].includes(code) ? CloudSun : [71, 73, 75, 77, 85, 86].includes(code) ? CloudSnow : [95, 96, 99].includes(code) ? CloudLightning : [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code) ? CloudRain : Cloud;
  return <Icon size={size} aria-hidden="true" />;
}
export function WeatherCard() {
  const tr = useT();
  const [location, setLocation] = useState(savedLocation),
    [query, setQuery] = useState(''),
    [results, setResults] = useState([]),
    [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState(''),
    [editing, setEditing] = useState(false);
  const searchAbort = useRef(null);
  const {
    cache,
    loading,
    error,
    refresh
  } = useRemoteData(`aster-weather-${location.latitude}-${location.longitude}`, async signal => parseWeather(await fetchJSON(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`, signal)));
  useEffect(() => {
    try {
      storage.setItem('aster-weather-location', JSON.stringify(location));
    } catch {}
  }, [location]);
  useEffect(() => () => searchAbort.current?.abort(), []);
  async function search(e) {
    e.preventDefault();
    if (query.trim().length < 2) {
      setSearchError('Enter at least two letters of a city name.');
      return;
    }
    searchAbort.current?.abort();
    const controller = new AbortController();
    searchAbort.current = controller;
    setSearching(true);
    setSearchError('');
    try {
      const data = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`, controller.signal);
      setResults((data.results || []).filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude)));
      if (!data.results?.length) setSearchError('No matching cities. Try another spelling.');
    } catch (err) {
      if (err.name !== 'AbortError') setSearchError('City search is unavailable. Try again later.');
    } finally {
      if (searchAbort.current === controller) setSearching(false);
    }
  }
  const data = validForecastCache(cache?.data) ? cache.data : null;
  return <section className={`${s.panel} ${f.weather}`} aria-label={tr("Weather forecast")}><div className={s.sectionHead}><div><span className={s.kicker}>{tr("OUTSIDE YOUR WINDOW")}</span><h2>{tr("Weather")}</h2></div><button className={s.iconButton} disabled={loading} aria-label={tr("Refresh weather")} onClick={refresh}><RefreshCw size={16} /></button></div><button className={f.location} aria-expanded={editing} onClick={() => setEditing(v => !v)}><MapPin size={15} />{tr(location.name)}{tr(", ")}{tr(location.country)}<span>{tr("Change")}</span></button>{tr(editing && <div className={f.cityPicker}><form onSubmit={search}><input aria-label={tr("Find a city")} value={query} onChange={e => setQuery(e.target.value)} placeholder={tr("Search a city…")} maxLength={80} /><button aria-label={tr("Search cities")} disabled={searching} type="submit"><Search size={18} /></button></form>{tr(searching && <p role="status">{tr("Finding cities…")}</p>)}{tr(searchError && <p role="alert">{tr(searchError)}</p>)}{tr(results.map((r, i) => <button key={r.id || i} onClick={() => {
        setLocation({
          name: r.name,
          country: r.country || r.admin1 || '',
          latitude: r.latitude,
          longitude: r.longitude
        });
        setEditing(false);
        setResults([]);
        setQuery('');
      }}>{tr(r.name)}<small>{tr([r.admin1, r.country].filter(Boolean).join(', '))}</small></button>))}</div>)}{tr(loading && !data ? <div className={s.skeleton} role="status" aria-label={tr("Loading weather")} /> : data ? <><div className={f.weatherNow}><div><strong>{tr(Math.round(data.current.temperature_2m))}<span>{tr("°C")}</span></strong><p>{tr(describeWeather(data.current.weather_code))}</p></div><WeatherIcon code={data.current.weather_code} size={65} /></div><div className={f.weatherMeta}><span>{tr("Feels like ")}{tr(Math.round(data.current.apparent_temperature))}{tr("°")}</span><span><Wind size={14} />{tr(Math.round(data.current.wind_speed_10m))}{tr(" km/h")}</span></div><div className={f.forecast}>{tr(data.daily.time.slice(0, 5).map((day, i) => <div key={day}><strong>{tr(i === 0 ? 'Today' : new Intl.DateTimeFormat('en-GB', {
              weekday: 'short',
              timeZone: 'UTC'
            }).format(new Date(day + 'T12:00:00Z')))}</strong><WeatherIcon code={data.daily.weather_code[i]} size={25} /><span>{tr(Math.round(data.daily.temperature_2m_max[i]))}{tr("° ")}<small>{tr(Math.round(data.daily.temperature_2m_min[i]))}{tr("°")}</small></span><small><Droplets size={10} />{tr(data.daily.precipitation_probability_max[i] ?? '–')}{tr("%")}</small></div>))}</div></> : <div className={s.empty}><CloudSun size={35} /><p>{tr("Live weather is unavailable.")}</p></div>)}{tr(error && <p className={s.error} role="status">{tr(data ? 'Showing the last saved forecast. ' : '')}{tr(error)}</p>)}<p className={s.sourceLine}><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">{tr("Open-Meteo")}</a>{tr(" · model forecast")}{tr(cache && <>{tr(" · retrieved ")}{tr(new Date(cache.fetchedAt).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }))}</>)}</p>{tr(data && <p className={s.fine}>{tr("Forecast time: ")}{tr(new Date(data.measured).toLocaleString('en-GB', {
        timeZone: data.timezone,
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }))}{tr(" (")}{tr(data.timezone)}{tr("). No device location is used.")}</p>)}</section>;
}
