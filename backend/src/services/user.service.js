const User = require('../models/User');
const Rsvp = require('../models/Rsvp');
const ApiError = require('../utils/ApiError');

// Acts as a lightweight sign-in: returns the existing profile for an email or creates one.
async function findOrCreate({ name, email, city }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return { user: existing, created: false };
  const user = await User.create({ name, email, city });
  return { user, created: true };
}

async function getById(id) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function update(id, changes) {
  const allowed = ['name', 'city', 'defaultReminderMinutes'];
  const patch = Object.fromEntries(Object.entries(changes).filter(([k]) => allowed.includes(k)));
  if (patch.defaultReminderMinutes !== undefined && !Rsvp.REMINDER_OPTIONS.includes(patch.defaultReminderMinutes)) {
    throw ApiError.badRequest(`defaultReminderMinutes must be one of ${Rsvp.REMINDER_OPTIONS.join(', ')}`);
  }
  const user = await User.findByIdAndUpdate(id, patch, { returnDocument: 'after', runValidators: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

module.exports = { findOrCreate, getById, update };
