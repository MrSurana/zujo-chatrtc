var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  // TODO: users from DB

  res.send([
    {
      _id: '1',
      name: 'johndoe',
    },
    {
      _id: '2',
      name: 'janedoe',
    },
    {
      _id: '3',
      name: 'brucewayne',
    },
  ]);
});

/* GET user messages listing. */
router.get('/:userId/messages', function (req, res, next) {
  // TODO: messages from DB using req.params.userId

  res.send([
    {
      _id: '1',
      text: 'Hello there!',
      senderId: '1'
    },
    {
      _id: '2',
      text: 'How are you doing today?',
      senderId: '1'
    },
    {
      _id: '3',
      text: 'I am doing good!',
      senderId: '2'
    },
  ]);
});

module.exports = router;
