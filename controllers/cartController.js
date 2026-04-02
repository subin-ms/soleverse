const Cart = require("../models/cartModel");

/* =========================
   ADD TO CART
========================= */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, size } = req.body;
    const userId = req.user.id;

    // Check if item already exists in cart for this user and size
    let cartItem = await Cart.findOne({
      user: userId,
      product: productId,
      size: size || null
    });

    if (cartItem) {
      // Increment quantity
      cartItem.quantity += Number(quantity) || 1;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        user: userId,
        product: productId,
        quantity: Number(quantity) || 1,
        size: size || null
      });
    }

    res.status(201).json(cartItem);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET USER CART
========================= */
exports.getCart = async (req, res) => {
  try {
    const items = await Cart.find({ user: req.user.id })
      .populate("product")
      .sort({ createdAt: -1 });

    const validItems = [];
    for (let item of items) {
      if (item.product) {
        validItems.push(item);
      } else {
        // Remove orphaned cart item if the product was deleted
        await Cart.findByIdAndDelete(item._id);
      }
    }

    res.json(validItems);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE CART QUANTITY
========================= */
exports.updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, size } = req.body;

    const cartItem = await Cart.findOneAndUpdate(
      { 
        user: req.user.id, 
        product: productId,
        size: size || null 
      },
      { quantity: Number(quantity) },
      { new: true }
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json(cartItem);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   REMOVE FROM CART
========================= */
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size } = req.query; // Size might be needed if multiple sizes of same product are in cart

    await Cart.findOneAndDelete({
      user: req.user.id,
      product: productId,
      size: size || null
    });

    res.json({ message: "Item removed from cart" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   CLEAR CART
========================= */
exports.clearCart = async (req, res) => {
  try {
    await Cart.deleteMany({ user: req.user.id });
    res.json({ message: "Cart cleared" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
