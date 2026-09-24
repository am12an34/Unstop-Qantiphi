const userService = require('../services/user.service');

async function register(req, res) {
  const { user, created } = await userService.findOrCreate(req.body);
  res.status(created ? 201 : 200).json(user);
}

async function me(req, res) {
  res.json(req.user);
}

async function updateMe(req, res) {
  const user = await userService.update(req.user._id, req.body);
  res.json(user);
}

module.exports = { register, me, updateMe };
