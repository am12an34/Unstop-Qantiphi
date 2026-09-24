const crypto = require('crypto');
const ShareLink = require('../models/ShareLink');
const LinkClick = require('../models/LinkClick');
const Rsvp = require('../models/Rsvp');
const env = require('../config/env');
const socket = require('../socket');
const ApiError = require('../utils/ApiError');

function shareUrl(token) {
  return `${env.serverUrl}/s/${token}`;
}

function present(link) {
  return {
    token: link.token,
    url: shareUrl(link.token),
    eventId: link.eventId,
    clicks: link.clickCount,
    createdAt: link.createdAt,
  };
}

// Only users who have RSVPed can invite friends. Returns the existing link if there is one.
async function createLink(user, eventId) {
  const rsvp = await Rsvp.findOne({ user: user._id, eventId });
  if (!rsvp) throw ApiError.forbidden('RSVP to this event before sharing it');

  const existing = await ShareLink.findOne({ user: user._id, eventId });
  if (existing) return present(existing);

  const link = await ShareLink.create({
    token: crypto.randomBytes(6).toString('base64url'),
    user: user._id,
    eventId,
    eventTitle: rsvp.event.title,
  });
  return present(link);
}

function hashVisitor(visitorId) {
  return crypto.createHash('sha256').update(visitorId).digest('hex');
}

async function friendsAttendingCounts(eventIds) {
  if (eventIds.length === 0) return {};
  const rows = await LinkClick.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

// Records a click from a visitor; repeat clicks by the same visitor are ignored.
async function recordClick(token, visitorId) {
  const link = await ShareLink.findOne({ token });
  if (!link) throw ApiError.notFound('Invite link not found');

  let counted = false;
  try {
    await LinkClick.create({ shareLink: link._id, eventId: link.eventId, visitorHash: hashVisitor(visitorId) });
    link.clickCount += 1;
    await link.save();
    counted = true;
  } catch (err) {
    if (err.code !== 11000) throw err;
  }

  if (counted) {
    const counts = await friendsAttendingCounts([link.eventId]);
    socket.emit('friends:update', {
      eventId: link.eventId,
      friendsAttending: counts[link.eventId] || 0,
      token: link.token,
      linkClicks: link.clickCount,
    });
  }
  return { link, counted };
}

// Public details shown to a friend who opened an invite.
async function getInvite(token) {
  const link = await ShareLink.findOne({ token }).populate('user', 'name');
  if (!link) throw ApiError.notFound('Invite link not found');
  return { token, eventId: link.eventId, eventTitle: link.eventTitle, invitedBy: link.user?.name || 'A friend' };
}

// Map of eventId -> share link for the given user, used by the dashboard.
async function linksForUser(userId) {
  const links = await ShareLink.find({ user: userId });
  return Object.fromEntries(links.map((l) => [l.eventId, present(l)]));
}

module.exports = { createLink, recordClick, getInvite, friendsAttendingCounts, linksForUser };
