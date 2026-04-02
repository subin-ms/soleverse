const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  addCategory,
  getCategories,
  getPublishedCategories,
  updateCategory,
  toggleCategoryStatus
} = require("../controllers/categoryController");

/* =========================
   ADMIN ROUTES
========================= */

router.post("/", protect, adminOnly, upload.single("image"), addCategory);

router.get("/", protect, adminOnly, getCategories);

router.put("/:id", protect, adminOnly, upload.single("image"), updateCategory);

router.patch("/:id/toggle-status", protect, adminOnly, toggleCategoryStatus);

/* =========================
   USER ROUTE
========================= */

router.get("/published", getPublishedCategories);

module.exports = router;