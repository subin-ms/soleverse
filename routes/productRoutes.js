const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  addProduct,
  getProducts,
  getPublicProducts,
  getPublicProductById,
  getProductById,
  deleteProduct,
  updateProduct,
  getSearchSuggestions
} = require("../controllers/productController");
const upload = require("../middleware/uploadMiddleware");

router.get("/public", getPublicProducts);
router.get("/suggestions", getSearchSuggestions);
router.get("/public/:id", getPublicProductById);
router.get("/:id", protect, adminOnly, getProductById);
router.get("/", protect, adminOnly, getProducts);
router.delete("/:id", protect, adminOnly, deleteProduct);
router.post(
  "/",
  protect,
  adminOnly,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "gallery", maxCount: 10 }]),
  addProduct
);
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "gallery", maxCount: 10 }]),
  updateProduct
);

module.exports = router;