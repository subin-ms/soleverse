const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  createOffer,
  getActiveOffers,
  getOffers,
  updateOffer,
  toggleOfferStatus,
  deleteOffer
} = require("../controllers/offerController");
const upload = require("../middleware/uploadMiddleware");

router.post("/", protect, adminOnly, upload.single("image"), createOffer);
router.get("/active", getActiveOffers);
router.get("/", protect, adminOnly, getOffers);
router.patch("/:id", protect, adminOnly, upload.single("image"), updateOffer);
router.patch("/:id/status", protect, adminOnly, toggleOfferStatus);
router.delete("/:id", protect, adminOnly, deleteOffer);

module.exports = router;
