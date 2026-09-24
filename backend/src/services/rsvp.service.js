const Rsvp = require('../models/Rsvp');
const eventService = require('./event.service');
const shareService = require('./share.service');
const ApiError = require('../utils/ApiError');

const DAY_MS = 24 * 60 * 60 * 1000;

function eventStart({ date, time }) {
  const clock = /^\d{2}:\d{2}$/.test(time || '') ? time : '00:00';
  return new Date(`${date}T${clock}:00`);
}

// Adds the derived fields the dashboard needs, so the client never computes them.
function present(rsvp) {
  const obj = rsvp.toObject();
  const start = eventStart(obj.event);
  const now = Date.now();
  const reminderAt = obj.reminder.enabled ? new Date(start.getTime() - obj.reminder.minutesBefore * 60000) : null;
  return {
    ...obj,
    id: obj._id,
    startsAt: start,
    isPast: start.getTime() < now,
    daysUntil: Math.max(0, Math.ceil((start.getTime() - now) / DAY_MS)),
    reminderAt,
    reminderDue: Boolean(reminderAt && reminderAt.getTime() <= now && start.getTime() > now),
  };
}

async function create(user, { eventId, ref }) {
  const event = await eventService.getEventById(eventId);
  if (eventStart(event).getTime() < Date.now() - DAY_MS) {
    throw ApiError.badRequest('Cannot RSVP to an event that has already happened');
  }
  const exists = await Rsvp.exists({ user: user._id, eventId });
  if (exists) throw ApiError.conflict('You have already RSVPed to this event');

  const rsvp = await Rsvp.create({
    user: user._id,
    eventId,
    event: {
      title: event.title,
      venue: event.venue,
      city: event.city,
      date: event.date,
      time: event.time,
      image: event.image,
      url: event.url,
      category: event.category,
    },
    reminder: { enabled: true, minutesBefore: user.defaultReminderMinutes || 1440 },
    referredBy: ref || null,
  });
  return present(rsvp);
}

async function listForUser(user, { includePast = false } = {}) {
  const rsvps = await Rsvp.find({ user: user._id }).sort({ 'event.date': 1, 'event.time': 1 });
  const eventIds = rsvps.map((r) => r.eventId);
  const [links, friends] = await Promise.all([
    shareService.linksForUser(user._id),
    shareService.friendsAttendingCounts(eventIds),
  ]);
  const items = rsvps.map((r) => ({
    ...present(r),
    share: links[r.eventId] || null,
    friendsAttending: friends[r.eventId] || 0,
  }));
  const upcoming = items.filter((r) => !r.isPast);
  const past = items.filter((r) => r.isPast);
  return {
    upcoming,
    past: includePast ? past : [],
    stats: { total: items.length, upcoming: upcoming.length, past: past.length },
  };
}

async function findOwned(user, id) {
  const rsvp = await Rsvp.findById(id);
  if (!rsvp) throw ApiError.notFound('RSVP not found');
  if (!rsvp.user.equals(user._id)) throw ApiError.forbidden('This RSVP belongs to another user');
  return rsvp;
}

async function updateReminder(user, id, { enabled, minutesBefore }) {
  const rsvp = await findOwned(user, id);
  if (enabled !== undefined) rsvp.reminder.enabled = enabled;
  if (minutesBefore !== undefined) rsvp.reminder.minutesBefore = minutesBefore;
  await rsvp.save();
  return present(rsvp);
}

async function remove(user, id) {
  const rsvp = await findOwned(user, id);
  await rsvp.deleteOne();
  return { id, eventId: rsvp.eventId };
}

// Returns the set of event ids (from the given list) this user has RSVPed to.
async function interestedEventIds(userId, eventIds) {
  if (!userId || eventIds.length === 0) return new Set();
  const rows = await Rsvp.find({ user: userId, eventId: { $in: eventIds } }, 'eventId').lean();
  return new Set(rows.map((r) => r.eventId));
}

async function attendeeCounts(eventIds) {
  if (eventIds.length === 0) return {};
  const rows = await Rsvp.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

module.exports = {
  create,
  listForUser,
  updateReminder,
  remove,
  interestedEventIds,
  attendeeCounts,
  REMINDER_OPTIONS: Rsvp.REMINDER_OPTIONS,
};
