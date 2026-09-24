const eventService = require('../services/event.service');

async function list(req, res) {
  const result = await eventService.listEvents(req.query);
  res.json(result);
}

async function calendar(req, res) {
  const result = await eventService.getCalendar(req.query);
  res.json(result);
}

async function getOne(req, res) {
  const event = await eventService.getEventById(req.params.id);
  res.json(event);
}

module.exports = { list, calendar, getOne };
