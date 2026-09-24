const { Router } = require('express');
const { query } = require('express-validator');
const validate = require('../middleware/validate');
const controller = require('../controllers/event.controller');

const router = Router();

const monthRule = query('month').matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('month must be YYYY-MM');
const dateRule = (field) => query(field).optional().isISO8601().withMessage(`${field} must be YYYY-MM-DD`);

router.get(
  '/',
  monthRule.optional(),
  dateRule('from'),
  dateRule('to'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  controller.list,
);

router.get('/calendar', monthRule, validate, controller.calendar);

router.get('/:id', controller.getOne);

module.exports = router;
