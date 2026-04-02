const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

// TODO: Add admin auth middleware if needed
// router.get("/admin", isAdmin, customerController.getAdminCustomers);

router.get("/admin", customerController.getAdminCustomers);
router.patch("/admin/:id/block", customerController.toggleBlockUser);

module.exports = router;
