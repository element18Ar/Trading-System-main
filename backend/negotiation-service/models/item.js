import mongoose from 'mongoose';

// Minimal Item schema for population in negotiation-service.
// Uses loose schema to avoid cross-service schema coupling.
const ItemSchema = new mongoose.Schema({
  name: { type: String },
  image: { type: String },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { strict: false, timestamps: false });

const Item = mongoose.model('Item', ItemSchema);
export default Item;

