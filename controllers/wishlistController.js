const Wishlist = require("../models/wishlistModel");

/* =========================
   ADD TO WISHLIST
========================= */
exports.addToWishlist = async (req, res) => {
  try {

    const { productId } = req.body;
    const userId = req.user.id;

    const exists = await Wishlist.findOne({
      user: userId,
      product: productId
    });

    if (exists) {
      return res.status(400).json({
        message: "Product already in wishlist"
      });
    }

    const wishlistItem = await Wishlist.create({
      user: userId,
      product: productId
    });

    res.status(201).json(wishlistItem);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================
   GET USER WISHLIST
========================= */
exports.getWishlist = async (req, res) => {

  try {

    const items = await Wishlist.find({
      user: req.user.id
    }).populate("product");

    // NEW: Auto-cleanup entries where product is null (deleted from DB)
    const nullProductIds = items
      .filter(item => !item.product)
      .map(item => item._id);

    if (nullProductIds.length > 0) {
      await Wishlist.deleteMany({ _id: { $in: nullProductIds } });
    }

    // Return only surviving valid items
    const validItems = items.filter(item => item.product);
    res.json(validItems);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};


/* =========================
   REMOVE FROM WISHLIST
========================= */
exports.removeFromWishlist = async (req, res) => {

  try {

    const { productId } = req.params;

    await Wishlist.findOneAndDelete({
      user: req.user.id,
      product: productId
    });

    res.json({
      message: "Removed from wishlist"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};