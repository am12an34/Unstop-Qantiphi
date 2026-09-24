const ticketmaster = require('./ticketmaster.service');
const buildMockEvents = require('../data/mockEvents');
const ApiError = require('../utils/ApiError');

const mockEvents = buildMockEvents();

function pad(n) {
  return String(n).padStart(2, '0');
}

// Resolves the query into an inclusive [from, to] range of YYYY-MM-DD dates.
function resolveRange({ month, from, to }) {
  if (month) {
    const [y, m] = month.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return { from: `${month}-01`, to: `${month}-${pad(lastDay)}` };
  }
  const today = new Date();
  const start = from || `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const later = new Date(today);
  later.setDate(later.getDate() + 90);
  const end = to || `${later.getFullYear()}-${pad(later.getMonth() + 1)}-${pad(later.getDate())}`;
  return { from: start, to: end };
}

function matchesText(value, query) {
  return !query || (value || '').toLowerCase().includes(query.toLowerCase());
}

function filterMock({ city, keyword, category, from, to }) {
  return mockEvents.filter(
    (e) =>
      e.date >= from &&
      e.date <= to &&
      matchesText(e.city, city) &&
      matchesText(e.category, category) &&
      (matchesText(e.title, keyword) || matchesText(e.venue, keyword)),
  );
}

async function fetchEvents(query = {}) {
  const { from, to } = resolveRange(query);
  const { city, keyword, category } = query;

  if (ticketmaster.isConfigured()) {
    try {
      const events = await ticketmaster.searchEvents({
        city,
        keyword,
        startDateTime: `${from}T00:00:00Z`,
        endDateTime: `${to}T23:59:59Z`,
      });
      return category ? events.filter((e) => matchesText(e.category, category)) : events;
    } catch (err) {
      console.warn(`Ticketmaster request failed, using mock events: ${err.message}`);
    }
  }
  return filterMock({ city, keyword, category, from, to });
}

async function listEvents(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
  const all = await fetchEvents(query);
  const start = (page - 1) * limit;
  return {
    events: all.slice(start, start + limit),
    page,
    limit,
    total: all.length,
    totalPages: Math.ceil(all.length / limit),
  };
}

// Groups a month's events by date so the calendar can highlight busy days.
async function getCalendar({ month, city, keyword }) {
  const events = await fetchEvents({ month, city, keyword });
  const days = {};
  for (const e of events) {
    days[e.date] = (days[e.date] || 0) + 1;
  }
  return { month, totalEvents: events.length, days };
}

async function getEventById(id) {
  const mock = mockEvents.find((e) => e.id === id);
  if (mock) return mock;
  if (!ticketmaster.isConfigured()) throw ApiError.notFound('Event not found');
  try {
    return await ticketmaster.getEvent(id);
  } catch (err) {
    if (err.response?.status === 404) throw ApiError.notFound('Event not found');
    throw err;
  }
}

module.exports = { listEvents, getCalendar, getEventById, fetchEvents };
