const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const currentUser = require('../middleware/currentUser');
const controller = require('../controllers/user.controller');

const router = Router();

router.post(
  '/',
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('city').optional().trim().isLength({ max: 60 }),
  validate,
  controller.register,
);

router.get('/me', currentUser(), controller.me);

router.patch(
  '/me',
  currentUser(),
  body('name').optional().trim().isLength({ min: 2, max: 60 }),
  body('city').optional().trim().isLength({ max: 60 }),
  body('defaultReminderMinutes').optional().isInt().toInt(),
  validate,
  controller.updateMe,
);

module.exports = router;
