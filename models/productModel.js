const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: String,
  price: { type: Number, required: true },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  discountValue: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  image: { type: String, default: "/img/default-product.png" },
  gallery: [{ type: String }],
  sizes: { type: Object, default: {} },
  stock: { type: Number, default: 0 },
  status: { type: String, default: "Active", enum: ["Active", "Draft", "Out of Stock"] }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);