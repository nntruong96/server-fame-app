const router = require('express').Router();
const Message = require('../../db/models/Message');
const Conversation = require('../../db/models/Conversation');
const CustomError = require('../middlewares/customError');

//add

router.post('/', async (req, res) => {
  const newMessage = new Message({ ...req.body, createAt: Date.now() });

  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    console.log(err);
    res.status(200).json({ error_code: 1000 });
  }
});

//get

router.get('/:conversationId', async (req, res, next) => {
  try {
    let { conversationId } = req.params;

    let { page_number = 0, page_size = 10 } = req.query;
    page_size = Number(page_size);
    page_number = Number(page_number);
    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: { $in: [req.userData.userId] },
    });
    if (!conversation) {
      return next(new CustomError(10035));
    }
    const messages = await Message.find({
      conversationId: conversationId,
    })
      .sort({
        createAt: -1,
      })
      .skip(page_number * page_size)
      .limit(page_size)
      .exec();
    messages.sort((a, b) => a.createAt - b.createAt);
    res.status(200).json({
      pageSize: page_size,
      pageNumber: page_number,
      messages,
    });
  } catch (err) {
    console.error('err', err);
    return next(new CustomError(10035));
  }
});

module.exports = router;
