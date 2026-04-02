const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// TODO: Add admin auth middleware if needed, but for now assuming it's protected by the frontend guard
// router.get("/stats", isAdmin, dashboardController.getDashboardStats);

router.get("/stats", dashboardController.getDashboardStats);

module.exports = router;
