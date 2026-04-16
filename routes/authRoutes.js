const express = require("express");
const router = express.Router();
const User = require("../models/userModel");


const {
  registerUser,
  loginUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
  verifyForgotOtp,
  updateProfile

} = require("../controllers/authController");
const { protect, adminOnly, userOnly } = require("../middleware/authMiddleware");





// VERIFY EMAIL
router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token
    });

    if (!user) {
      return res.status(400).send("Invalid or expired link");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send(`
      <h2>Email Verified Successfully</h2>
      <p>You can now login to Soleverse.</p>
    `);

  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/me", protect, userOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/profile", protect, userOnly, updateProfile);
router.post("/verify-otp", verifyOTP);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-forgot-otp", verifyForgotOtp);



router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});



module.exports = router;
