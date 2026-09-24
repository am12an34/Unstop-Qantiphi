const { Router } = require('express');
const eventRoutes = require('./event.routes');
const userRoutes = require('./user.routes');
const rsvpRoutes = require('./rsvp.routes');
const shareRoutes = require('./share.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/rsvps', rsvpRoutes);
router.use('/share', shareRoutes);

module.exports = router;
