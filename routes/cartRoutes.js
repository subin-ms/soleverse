const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
} = require("../controllers/cartController");

// All cart routes are protected
router.use(protect);

router.post("/", addToCart);
router.get("/", getCart);
router.put("/:productId", updateCartQuantity);
router.delete("/:productId", removeFromCart);
router.delete("/", clearCart);

module.exports = router;
