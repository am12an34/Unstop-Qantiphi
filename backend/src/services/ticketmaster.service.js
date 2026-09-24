const axios = require('axios');
const env = require('../config/env');

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

const client = axios.create({ baseURL: BASE_URL, timeout: 8000 });

function isConfigured() {
  return Boolean(env.tmApiKey);
}

// Maps a raw Ticketmaster event to the shape the rest of the app uses.
function normalize(raw) {
  const venue = raw._embedded?.venues?.[0];
  const image = [...(raw.images || [])].sort((a, b) => b.width - a.width)[0];
  return {
    id: raw.id,
    title: raw.name,
    category: raw.classifications?.[0]?.segment?.name || 'Other',
    venue: venue?.name || 'Venue TBA',
    city: venue?.city?.name || '',
    date: raw.dates?.start?.localDate || null,
    time: raw.dates?.start?.localTime?.slice(0, 5) || 'TBA',
    image: image?.url || null,
    url: raw.url || null,
    source: 'ticketmaster',
  };
}

async function cachedGet(path, params) {
  const key = path + JSON.stringify(params);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  const { data } = await client.get(path, { params: { apikey: env.tmApiKey, ...params } });
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

async function searchEvents({ city, keyword, startDateTime, endDateTime, size = 100 }) {
  const params = { size, sort: 'date,asc', startDateTime, endDateTime };
  if (city) params.city = city;
  if (keyword) params.keyword = keyword;
  const data = await cachedGet('/events.json', params);
  return (data._embedded?.events || []).map(normalize).filter((e) => e.date);
}

async function getEvent(id) {
  const data = await cachedGet(`/events/${encodeURIComponent(id)}.json`, {});
  return normalize(data);
}

module.exports = { isConfigured, searchEvents, getEvent };
