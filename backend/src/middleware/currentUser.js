const { isValidObjectId } = require('mongoose');
const User = require('../models/User');

// Identifies the caller from the x-user-id header (issued by POST /api/users).
// `required` rejects anonymous requests; otherwise req.user is simply left null.
function currentUser({ required = true } = {}) {
  return async (req, res, next) => {
    const id = req.get('x-user-id');
    req.user = id && isValidObjectId(id) ? await User.findById(id) : null;
    if (required && !req.user) {
      return res.status(401).json({ error: 'Create a profile first (missing or invalid x-user-id)' });
    }
    next();
  };
}

module.exports = currentUser;
