const { Router } = require('express');
const eventRoutes = require('./event.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/events', eventRoutes);

module.exports = router;
