import Trade from '../models/trade.js';
import Item from '../models/item.js';
import '../models/user.js';
import Message from '../models/message.js';

export const createTrade = async (req, res) => {
  try {
    const { initiatorId, receiverId, receiverItemId, itemId } = req.body;

    const existingTrade = await Trade.findOne({
      initiator: initiatorId,
      receiver: receiverId,
      receiverItems: receiverItemId,
      status: { $in: ['proposed', 'negotiating'] }
    });

    if (existingTrade) return res.status(200).json(existingTrade);

    const newTrade = new Trade({
      initiator: initiatorId,
      receiver: receiverId,
      receiverItems: [receiverItemId],
      initiatorItems: [],
      item: itemId || receiverItemId,
      status: 'proposed',
      lastActivity: Date.now()
    });

    const savedTrade = await newTrade.save();
    res.status(201).json(savedTrade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTradeDetails = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.tradeId)
      .populate('initiator', 'username email avatar')
      .populate('receiver', 'username email avatar')
      .populate('initiatorItems')
      .populate('receiverItems')
      .populate('item');

    if (!trade) return res.status(404).json({ error: "Trade not found" });

    res.status(200).json(trade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTradeOffer = async (req, res) => {
  try {
    const { userId, items, cash } = req.body;
    const tradeId = req.params.tradeId;

    const trade = await Trade.findById(tradeId);
    if (!trade) return res.status(404).json({ error: "Trade not found" });

    if (userId === trade.initiator.toString()) trade.initiatorItems = items;
    else if (userId === trade.receiver.toString()) trade.receiverItems = items;
    else return res.status(403).json({ error: "You are not part of this trade" });

    if (cash) trade.cashOffer = cash;
    trade.status = 'negotiating';
    trade.lastActivity = Date.now();

    const updated = await trade.save();
    const populated = await updated.populate('initiatorItems receiverItems');
    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTradeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const trade = await Trade.findById(req.params.tradeId);
    if (!trade) return res.status(404).json({ error: "Trade not found" });

    trade.status = status;
    trade.lastActivity = Date.now();
    await trade.save();

    if (status === 'completed') {
      const allItems = [...trade.initiatorItems, ...trade.receiverItems];
      await Item.updateMany({ _id: { $in: allItems } }, { isListed: false, status: 'traded' });
    }

    res.status(200).json(trade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserTrades = async (req, res) => {
  try {
    const userId = req.params.userId;
    const trades = await Trade.find({ $or: [{ initiator: userId }, { receiver: userId }] })
      .sort({ lastActivity: -1 })
      .populate('initiator receiver', 'username avatar')
      .populate('initiatorItems receiverItems')
      .populate('item');

    const enriched = await Promise.all(trades.map(async t => {
      const unreadCount = await Message.countDocuments({ tradeId: t._id, isRead: false, sender: { $ne: userId } });
      const obj = t.toObject();
      obj.unreadCount = unreadCount;
      return obj;
    }));

    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
