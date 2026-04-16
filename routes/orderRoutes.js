const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  returnOrder,
  getAllOrders,
  updateOrderStatus,
  getCancellationByOrderId,
  getReturnByOrderId,
  getAdminOrderById,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/orderController");
const { protect, userOnly } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.use(protect);

router.post("/", userOnly, placeOrder);
router.get("/", userOnly, getMyOrders);
router.get("/:id", userOnly, getOrderById);
router.put("/:id/cancel", userOnly, cancelOrder);
router.put("/:id/return", userOnly, upload.array("images", 3), returnOrder);

// Razorpay Routes
router.post("/razorpay/create-order", createRazorpayOrder);
router.post("/razorpay/verify-payment", verifyRazorpayPayment);

// Admin Routes
router.get("/admin/all", isAdmin, getAllOrders);
router.get("/admin/:id", isAdmin, getAdminOrderById);
router.get("/:id/cancellation", getCancellationByOrderId);
router.get("/:id/return-details", getReturnByOrderId);
router.put("/admin/:id/status", isAdmin, updateOrderStatus);

module.exports = router;
