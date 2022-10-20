const router = require('express').Router();
const Conversation = require('../../db/models/Conversation');
const User = require('../../db/models/User');
const Message = require('../../db/models/Message');
const ObjectId = require('mongodb').ObjectId;
const keys = '_id firstName lastName profilePicture email username';
router.post('/', async (req, res) => {
  let firstUser = await User.findOne({
    _id: ObjectId(req.params.firstUserId),
  });
  let secondUser = await User.findOne({
    _id: ObjectId(req.params.secondUserId),
  });

  const newConversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId],
    info: [firstUser._id, secondUser._id],
  });

  try {
    const savedConversation = await newConversation.save();
    await savedConversation.populate('info', keys);
    await savedConversation.populated('info');
    res.status(200).json(savedConversation);
  } catch (err) {
    console.log(err);
    res.status(200).json({ error_code: 1000 });
  }
});

//get conv of a user

router.get('/:userId', async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    }).populate('info', keys);
    res.status(200).json(conversation);
  } catch (err) {
    console.log('err', err);
    res.status(200).json({ error_code: 1000 });
  }
});

// get conv includes two userId

router.get('/find/:firstUserId/:secondUserId', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    if (conversation) {
      await conversation.populate({ model: 'User', path: 'info' });
      await conversation.populated('info');
    } else {
      let firstUser = await User.findOne({
        _id: ObjectId(req.params.firstUserId),
      });
      let secondUser = await User.findOne({
        _id: ObjectId(req.params.secondUserId),
      });
      const newConversation = new Conversation({
        members: [req.params.firstUserId, req.params.secondUserId],
        info: [firstUser._id, secondUser._id],
      });

      const savedConversation = await newConversation.save();
      await savedConversation.populate('info', keys);
      await savedConversation.populated('info');
      return res.status(200).json(savedConversation);
    }
    res.status(200).json(conversation);
  } catch (err) {
    console.log('err', err);
    res.status(200).json({ error_code: 1000 });
  }
});

module.exports = router;
