const mongoose = require("mongoose");

const cancellationSchema = new mongoose.Schema(
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
      default: "User requested cancellation"
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      required: true
    },
    status: {
       type: String,
       default: "Pending" // Can be "Pending", "Approved", "Processed"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cancellation", cancellationSchema);
