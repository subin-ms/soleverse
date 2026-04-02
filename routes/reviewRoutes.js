const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { 
  submitReview, 
  getProductReviews,
  getAdminReviews,
  updateReviewStatus,
  deleteReview 
} = require("../controllers/reviewController");

// Public route to get reviews for a product (Customer View)
router.get("/product/:productId", getProductReviews);

// Protected route to submit a review
router.post("/", protect, upload.array("photos", 4), submitReview);

// Admin Routes for managing reviews
router.get("/admin", protect, adminOnly, getAdminReviews);
router.put("/:id/status", protect, adminOnly, updateReviewStatus);
router.delete("/:id", protect, adminOnly, deleteReview);

module.exports = router;
