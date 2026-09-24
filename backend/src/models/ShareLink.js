const { Schema, model } = require('mongoose');

const shareLinkSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: String, required: true },
    eventTitle: String,
    // Unique visitors who opened this link (one per visitor cookie).
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One link per user per event; generating again returns the same link.
shareLinkSchema.index({ user: 1, eventId: 1 }, { unique: true });

module.exports = model('ShareLink', shareLinkSchema);
