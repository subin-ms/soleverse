const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  size: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Ensure a user can only have one entry for a specific product and size combo
cartSchema.index({ user: 1, product: 1, size: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);
