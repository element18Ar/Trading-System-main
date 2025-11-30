import Message from '../models/message.js';
import Trade from '../models/trade.js';

export const createMessage = async (req, res) => {
  try {
    const { tradeId, sender, content, type } = req.body;

    const tradeExists = await Trade.findById(tradeId);
    if (!tradeExists) return res.status(404).json({ error: "Trade room not found" });

    const newMessage = new Message({ tradeId, sender, content, type: type || 'text', itemId: tradeExists.item });
    const savedMessage = await newMessage.save();

    await Trade.findByIdAndUpdate(tradeId, { lastActivity: Date.now() });

    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ tradeId: req.params.tradeId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username avatar');

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
