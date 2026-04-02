const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      match: [/^[A-Za-z\s]{2,}$/, "First name must contain only letters and be at least 2 characters long"],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      match: [/^[A-Za-z\s]{2,}$/, "Last name must contain only letters and be at least 2 characters long"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
    },
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
    },
    apartment: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      match: [/^[A-Za-z\s]{2,}$/, "City name must contain only letters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      match: [/^[A-Za-z\s]{2,}$/, "State name must contain only letters"],
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      match: [/^\d{6}$/, "Please provide a valid 6-digit pincode"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
