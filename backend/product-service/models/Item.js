import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // NEW: Store uploaded image file path
    image: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: false,
      default: 0,
    },

    // Required seller ID (ObjectId)
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isListed: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    reviewNote: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Item", ItemSchema);
