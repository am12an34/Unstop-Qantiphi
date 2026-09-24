const crypto = require('crypto');
const shareService = require('../services/share.service');
const env = require('../config/env');

const VISITOR_COOKIE = 'vid';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function create(req, res) {
  const link = await shareService.createLink(req.user, req.body.eventId);
  res.status(201).json(link);
}

async function invite(req, res) {
  const details = await shareService.getInvite(req.params.token);
  res.json(details);
}

// GET /s/:token: counts the click once per visitor, then sends them to the event in the app.
async function follow(req, res) {
  let visitorId = req.cookies[VISITOR_COOKIE];
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    res.cookie(VISITOR_COOKIE, visitorId, { httpOnly: true, sameSite: 'lax', maxAge: ONE_YEAR_MS });
  }

  try {
    const { link } = await shareService.recordClick(req.params.token, visitorId);
    res.redirect(`${env.clientUrl}/?event=${encodeURIComponent(link.eventId)}&ref=${link.token}`);
  } catch (err) {
    if (err.status === 404) return res.redirect(`${env.clientUrl}/?invite=invalid`);
    throw err;
  }
}

module.exports = { create, invite, follow };
