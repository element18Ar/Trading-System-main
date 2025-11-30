import mongoose from 'mongoose';

const TradeSchema = new mongoose.Schema({
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatorItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }],
  receiverItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }],
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  },
  cashOffer: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'php' }
  },
  status: {
    type: String,
    enum: ['proposed', 'negotiating', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'proposed'
  },
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true
});

TradeSchema.index({ initiator: 1, receiver: 1 });

const Trade = mongoose.model('Trade', TradeSchema);
export default Trade;
