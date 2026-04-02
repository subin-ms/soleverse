const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    /* =====================
       BASIC INFO
    ===================== */
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    /* =====================
       EMAIL VERIFICATION
    ===================== */
    isVerified: {
      type: Boolean,
      default: false
    },

    otp: {
      type: String // hashed OTP
    },

    otpExpires: {
      type: Date
    },

    /* =====================
       FORGOT PASSWORD
    ===================== */
    resetOtp: {
      type: String // hashed reset OTP
    },

    resetOtpExpires: {
      type: Date
    },

    resetOtpVerified: {
      type: Boolean,
      default: false
    },

    /* =====================
       WALLET
    ===================== */
    wallet: {
      type: Number,
      default: 0
    },
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
