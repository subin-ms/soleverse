const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Admin Side Returns API
router.get("/admin/all", protect, adminOnly, returnController.getAllReturns);
router.put("/admin/:id/status", protect, adminOnly, returnController.updateReturnStatus);

module.exports = router;
