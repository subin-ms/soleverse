const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  addProduct,
  getProducts,
  getPublicProducts,
  getPublicProductById,
  deleteProduct,
  updateProduct   // ✅ ADD THIS
} = require("../controllers/productController");
const upload = require("../middleware/uploadMiddleware");
router.post("/add-product", protect, adminOnly, addProduct);
router.get("/", protect, adminOnly, getProducts);
router.get("/public", getPublicProducts);
router.get("/public/:id", getPublicProductById);
router.delete("/:id", protect, adminOnly, deleteProduct);
router.post(
  "/",
  protect,
  adminOnly,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "gallery", maxCount: 10 }]),
  addProduct
);
router.put("/:id", updateProduct);
module.exports = router;