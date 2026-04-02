const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ["Published", "Draft"],
    default: "Published"
  },
    image: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);