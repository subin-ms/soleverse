const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

// Admin Transactions Route
router.get("/admin", protect, isAdmin, transactionController.getTransactions);

// User Transactions & Wallet Routes
router.get("/my", protect, transactionController.getMyTransactions);
router.post("/add-funds", protect, transactionController.addFundsRazorpay);
router.post("/verify-add-funds", protect, transactionController.verifyAddFunds);

module.exports = router;
