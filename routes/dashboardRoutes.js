const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

router.get("/stats", protect, isAdmin, dashboardController.getDashboardStats);

module.exports = router;
