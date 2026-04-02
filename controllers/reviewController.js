const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");

// Submit a new review
exports.submitReview = async (req, res) => {
  try {
    const { productId, orderId, rating, reviewText } = req.body;
    const userId = req.user.id; // From protect middleware

    // Basic validation
    if (!productId || !orderId || !rating || !reviewText) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if order exists, belongs to user, and is Delivered
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: "Delivered",
      "items.product": productId 
    });

    if (!order) {
      return res.status(400).json({ message: "You can only review products from delivered orders." });
    }

    // Check if user already reviewed this product from this order
    const existingReview = await Review.findOne({ order: orderId, product: productId, user: userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product for this order." });
    }

    // Process uploaded photos
    const photos = req.files ? req.files.map((file) => `/${file.destination.replace(/\\/g, "/")}/${file.filename}`) : [];

    const review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating: Number(rating),
      reviewText,
      photos,
    });

    res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a product (Customer View - ONLY APPROVED)
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { product: productId, status: 'approved' };

    const reviews = await Review.find(query)
      .populate("user", "name") 
      .populate({
        path: 'order',
        select: 'items',
      })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments(query);
    
    // Calculate average rating and distribution
    const mongoose = require('mongoose');
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' }, 
          numReviews: { $sum: 1 },
          star1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          star5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } }
        } 
      }
    ]);

    const averageRating = stats.length > 0 ? stats[0].avgRating.toFixed(1) : 0;
    const totalCount = stats.length > 0 ? stats[0].numReviews : 0;
    const distribution = stats.length > 0 ? {
        5: stats[0].star5,
        4: stats[0].star4,
        3: stats[0].star3,
        2: stats[0].star2,
        1: stats[0].star1
    } : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    res.json({
      reviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
      averageRating,
      totalCount,
      distribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================== ADMIN CONTROLLERS ======================== //

// Get all reviews for Admin
exports.getAdminReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name _id image')
      .sort({ createdAt: -1 });
    
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update review status (Approve/Reject)
exports.updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: `Review status updated to ${status}`, review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a review completely
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
