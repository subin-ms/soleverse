const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ["Damaged", "Wrong size", "Not satisfied", "Other"],
    },
    condition: {
      type: String,
      required: true,
      enum: ["Unopened", "Opened", "Used"],
    },
    resolution: {
      type: String,
      default: "Wallet",
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    images: [{
      type: String, // Store image paths
    }],
    comments: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", returnSchema);
