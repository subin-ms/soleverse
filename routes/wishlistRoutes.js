const express = require("express");
const router = express.Router();

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist
} = require("../controllers/wishlistController");

const { protect, userOnly } = require("../middleware/authMiddleware");

router.post("/", protect, userOnly, addToWishlist);
router.get("/", protect, userOnly, getWishlist);
router.delete("/:productId", protect, userOnly, removeFromWishlist);

module.exports = router;