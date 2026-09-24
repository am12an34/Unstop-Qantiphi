const eventService = require('../services/event.service');
const rsvpService = require('../services/rsvp.service');
const shareService = require('../services/share.service');

// Adds per-user and social fields to raw events.
async function enrich(events, user) {
  const ids = events.map((e) => e.id);
  const [interested, attendees, friends] = await Promise.all([
    rsvpService.interestedEventIds(user?._id, ids),
    rsvpService.attendeeCounts(ids),
    shareService.friendsAttendingCounts(ids),
  ]);
  return events.map((e) => ({
    ...e,
    isInterested: interested.has(e.id),
    attendeeCount: attendees[e.id] || 0,
    friendsAttending: friends[e.id] || 0,
  }));
}

async function list(req, res) {
  const result = await eventService.listEvents(req.query);
  result.events = await enrich(result.events, req.user);
  res.json(result);
}

async function calendar(req, res) {
  const result = await eventService.getCalendar(req.query);
  res.json(result);
}

async function getOne(req, res) {
  const event = await eventService.getEventById(req.params.id);
  const [enriched] = await enrich([event], req.user);
  res.json(enriched);
}

module.exports = { list, calendar, getOne, enrich };
