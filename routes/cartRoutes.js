const express = require("express");
const router = express.Router();
const { protect, userOnly } = require("../middleware/authMiddleware");
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
} = require("../controllers/cartController");

// All cart routes are protected and restricted to users only
router.use(protect, userOnly);

router.post("/", addToCart);
router.get("/", getCart);
router.put("/:productId", updateCartQuantity);
router.delete("/:productId", removeFromCart);
router.delete("/", clearCart);

module.exports = router;
