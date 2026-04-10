const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  discountType: { type: String, enum: ["Percentage", "Fixed Amount"], required: true },
  discountValue: { type: Number, required: true },
  targetCategory: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Offer", offerSchema);
