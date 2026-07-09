const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  discountType: { type: String, enum: ["Percentage", "Fixed Amount"], required: true },
  discountValue: { type: Number, required: true },
  offerType: { type: String, enum: ["Category", "Product", "Global"], default: "Category" },
  targetCategory: { type: String },
  targetProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Offer", offerSchema);
