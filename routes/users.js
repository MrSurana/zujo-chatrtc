var express = require('express');
var router = express.Router();
var User = require('../models/user.model');

/* GET users listing. */
router.get('/', async (req, res, next) => {
  res.send(await User.find({}));
});

/* GET user messages listing. */
router.get('/:username', async (req, res, next) => {
  let user = await User.findOne({ username: req.params.username });

  if (user == null) {
    user = new User({ username: req.params.username });
    await user.save();
  }

  res.send(user);
})

/* GET user messages listing. */
router.get('/:userId/messages', function (req, res, next) {
  // TODO: messages from DB using req.params.userId

  res.send([]);
});

module.exports = router;
