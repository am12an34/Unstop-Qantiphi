const rsvpService = require('../services/rsvp.service');

async function create(req, res) {
  const rsvp = await rsvpService.create(req.user, req.body);
  res.status(201).json(rsvp);
}

async function list(req, res) {
  const result = await rsvpService.listForUser(req.user, { includePast: req.query.includePast === 'true' });
  res.json(result);
}

async function updateReminder(req, res) {
  const rsvp = await rsvpService.updateReminder(req.user, req.params.id, req.body);
  res.json(rsvp);
}

async function remove(req, res) {
  const result = await rsvpService.remove(req.user, req.params.id);
  res.json(result);
}

module.exports = { create, list, updateReminder, remove };
