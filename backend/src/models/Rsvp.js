const { Schema, model } = require('mongoose');

const REMINDER_OPTIONS = [15, 60, 180, 1440, 4320];

const rsvpSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: String, required: true },
    // Snapshot so the dashboard works without re-fetching from Ticketmaster.
    event: {
      title: String,
      venue: String,
      city: String,
      date: String,
      time: String,
      image: String,
      url: String,
      category: String,
    },
    status: { type: String, enum: ['going'], default: 'going' },
    reminder: {
      enabled: { type: Boolean, default: true },
      minutesBefore: { type: Number, enum: REMINDER_OPTIONS, default: 1440 },
    },
    // Share link token that brought this user here, if any.
    referredBy: { type: String, default: null },
  },
  { timestamps: true },
);

rsvpSchema.index({ user: 1, eventId: 1 }, { unique: true });
rsvpSchema.index({ eventId: 1 });

const Rsvp = model('Rsvp', rsvpSchema);
Rsvp.REMINDER_OPTIONS = REMINDER_OPTIONS;

module.exports = Rsvp;
