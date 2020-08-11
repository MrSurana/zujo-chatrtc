var express = require('express');
var router = express.Router();
var User = require('../models/user.model');
var Message = require('../models/message.model');

/* GET users listing. */
router.get('/', async (req, res, next) => {
  res.send(await User.find({}));
});

/* GET user messages listing. */
router.get('/:username', async (req, res, next) => {
  if (!req.params.username.match(/^[a-zA-Z]+$/)) {
    res.status(400).send('Invalid username!');
  }


  let user = await User.findOne({ username: req.params.username });

  if (user == null) {
    user = new User({ username: req.params.username });
    await user.save();
  }

  res.send(user);
})

/* GET user messages listing. */
router.get('/:userId1/:userId2/messages', async (req, res, next) => {
  res.send(await Message.find().or([
    { senderId: req.params.userId1, receiverId: req.params.userId2 },
    { senderId: req.params.userId2, receiverId: req.params.userId1 }
  ]));
});

/* Save message. */
router.post('/:senderId/:receiverId/messages', async (req, res, next) => {
  const message = new Message({
    text: req.body.text,
    senderId: req.params.senderId,
    receiverId: req.params.receiverId
  });

  await message.save();

  res.send(message);
});

module.exports = router;
