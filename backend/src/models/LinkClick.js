const { Schema, model } = require('mongoose');

const linkClickSchema = new Schema(
  {
    shareLink: { type: Schema.Types.ObjectId, ref: 'ShareLink', required: true },
    eventId: { type: String, required: true },
    visitorHash: { type: String, required: true },
  },
  { timestamps: true },
);

// The same visitor clicking the same link twice is only counted once.
linkClickSchema.index({ shareLink: 1, visitorHash: 1 }, { unique: true });
linkClickSchema.index({ eventId: 1 });

module.exports = model('LinkClick', linkClickSchema);
