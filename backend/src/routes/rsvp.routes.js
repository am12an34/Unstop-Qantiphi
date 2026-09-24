const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const currentUser = require('../middleware/currentUser');
const controller = require('../controllers/rsvp.controller');
const { REMINDER_OPTIONS } = require('../services/rsvp.service');

const router = Router();
const idRule = param('id').isMongoId().withMessage('Invalid RSVP id');

router.use(currentUser());

router.get('/', controller.list);

router.post(
  '/',
  body('eventId').isString().trim().notEmpty().withMessage('eventId is required'),
  body('ref').optional({ values: 'null' }).isString().trim(),
  validate,
  controller.create,
);

router.patch(
  '/:id/reminder',
  idRule,
  body('enabled').optional().isBoolean().withMessage('enabled must be true/false').toBoolean(),
  body('minutesBefore')
    .optional()
    .isIn(REMINDER_OPTIONS)
    .withMessage(`minutesBefore must be one of ${REMINDER_OPTIONS.join(', ')}`)
    .toInt(),
  validate,
  controller.updateReminder,
);

router.delete('/:id', idRule, validate, controller.remove);

module.exports = router;
