const express = require("express");
const router = express.Router();
const { submitMessage, getAllMessages, markAsRead } = require("../controllers/contactController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public Route
router.post("/", submitMessage);

// Admin Routes
router.get("/admin/all", protect, adminOnly, getAllMessages);
router.patch("/admin/:id/read", protect, adminOnly, markAsRead);

module.exports = router;
