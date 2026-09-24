const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: String, trim: true, default: '' },
    // Default reminder applied to new RSVPs; each RSVP can override it.
    defaultReminderMinutes: { type: Number, default: 1440 },
  },
  { timestamps: true },
);

module.exports = model('User', userSchema);
