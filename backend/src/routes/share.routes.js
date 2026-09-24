const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const currentUser = require('../middleware/currentUser');
const controller = require('../controllers/share.controller');

const router = Router();

router.post(
  '/',
  currentUser(),
  body('eventId').isString().trim().notEmpty().withMessage('eventId is required'),
  validate,
  controller.create,
);

router.get('/:token', param('token').isLength({ min: 4, max: 32 }), validate, controller.invite);

module.exports = router;
