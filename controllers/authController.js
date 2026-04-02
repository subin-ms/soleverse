const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

/* =========================
   REGISTER USER
========================= */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHashed = await bcrypt.hash(otp, 10);

    // 🔁 USER EXISTS BUT NOT VERIFIED → RESEND OTP
    if (user && !user.isVerified) {
      user.otp = otpHashed;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      // 📧 SEND OTP EMAIL
      await sendEmail({
        to: email,
        subject: "Soleverse Account Verification OTP",
        html: `
          <h2>Welcome back to Soleverse 👟</h2>
          <p>Your verification OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
        `
      });

      console.log("📧 RESENT REGISTER OTP 👉", otp);

      return res.status(200).json({
        message: "OTP resent to your email"
      });
    }

    // 🆕 NEW USER REGISTRATION
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      otp: otpHashed,
      otpExpires: Date.now() + 10 * 60 * 1000,
      isVerified: false
    });

    // 📧 SEND OTP EMAIL
    await sendEmail({
      to: email,
      subject: "Soleverse Account Verification OTP",
      html: `
        <h2>Welcome to Soleverse 👟</h2>
        <p>Your account verification OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `
    });

    console.log("📧 REGISTER OTP SENT 👉", otp);

    return res.status(201).json({
      message: "OTP sent to your email"
    });

  } catch (error) {
    console.error("REGISTER ERROR 👉", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already exists. Please verify OTP or login."
      });
    }

    return res.status(500).json({ message: error.message });
  }
};


/* =========================
   VERIFY OTP
========================= */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (!user.otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isValid = await bcrypt.compare(otp, user.otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });

  } catch (error) {
    console.error("VERIFY OTP ERROR 👉", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   LOGIN USER
========================= */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔓 LOGIN ATTEMPT:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      console.log("🔍 FOUND USER:", user.email, "ROLE:", user.role);
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email before login"
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔐 Login Password Check:", { inputPassword: password, storedHash: user.password.substring(0, 10) + "...", isMatch });

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: "Login successful",
      token, // Return token for frontend storage
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR 👉", error.message);
    res.status(500).json({ message: error.message });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📩 FORGOT PASSWORD REQUEST:", email);

    const user = await User.findOne({ email });
    console.log("👤 USER FOUND:", !!user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🔢 GENERATED OTP:", otp);

    const hashedOtp = await bcrypt.hash(otp, 10);
    console.log("🔐 OTP HASHED");

    user.resetOtp = hashedOtp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    user.resetOtpVerified = false;
    await user.save();

    console.log("💾 OTP SAVED TO DB");

    // 🚨 THIS IS WHERE IT USUALLY FAILS
    await sendEmail({
      to: email,
      subject: "Soleverse Password Reset OTP",
      html: `<h1>Your OTP: ${otp}</h1>`
    });

    console.log("✅ EMAIL SENT SUCCESS");

    return res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("❌ FORGOT PASSWORD ERROR 👉", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyForgotOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("🔍 VERIFY OTP ATTEMPT:", email, otp);


    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❌ OTP expired or missing
    if (!user.resetOtp || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ✅ bcrypt compare (THIS IS CRITICAL)
    const isValidOtp = await bcrypt.compare(otp.toString(), user.resetOtp);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ mark verified
    user.resetOtpVerified = true;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return res.json({
      message: "OTP verified successfully"
    });




  } catch (error) {
    console.error("VERIFY FORGOT OTP ERROR 👉", error);
    return res.status(500).json({ message: "Server error" });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log("🔄 RESET PASSWORD REQUEST FOR:", email);
    console.log("Password received:", !!newPassword);
    console.log(newPassword)
    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Email and new password are required"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.resetOtpVerified !== true) {
      return res.status(400).json({
        message: "OTP not verified"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    console.log("🔐 New Password Hashed:", user.password.substring(0, 10) + "...");

    // ✅ Mark as verified since they proved ownership via email OTP
    user.isVerified = true;

    // ✅ cleanup correctly
    user.resetOtpVerified = false;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;

    const savedUser = await user.save();
    console.log("💾 User Saved to DB. New Password Hash in DB:", savedUser.password.substring(0, 10) + "...");
    console.log("✅ PASSWORD UPDATED FOR:", email);

    return res.json({
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("❌ RESET PASSWORD ERROR 👉", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};







/* =========================
   UPDATE PROFILE
========================= */
const updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Updating basic info
    if (name) {
      user.name = name;
    }

    // Password Update Logic
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password does not match" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR 👉", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   EXPORTS (IMPORTANT)
========================= */
module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyForgotOtp,
  updateProfile

};
