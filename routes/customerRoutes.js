const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

router.get("/admin", protect, isAdmin, customerController.getAdminCustomers);
router.patch("/admin/:id/block", protect, isAdmin, customerController.toggleBlockUser);

module.exports = router;
