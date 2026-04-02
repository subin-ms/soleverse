const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Cancellation = require("../models/cancellationModel");
const Return = require("../models/returnModel");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");

/* =========================
   PLACE NEW ORDER
========================= */
exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;

    // 1. Fetch user's cart
    const cartItems = await Cart.find({ user: userId }).populate("product");

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cannot place order with an empty cart" });
    }

    // 2. Prepare order items and calculate total
    let totalAmount = 0;
    const orderItems = cartItems.map((item) => {
      const price = item.product.price;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      return {
        product: item.product._id,
        quantity: item.quantity,
        size: item.size,
        price: price,
      };
    });

    // 3. Handle Coupon/Discount
    let discountAmount = 0;
    let couponId = null;
    if (req.body.coupon) {
      const Coupon = require("../models/couponModel");
      const couponDoc = await Coupon.findById(req.body.coupon);
      if (couponDoc && couponDoc.status === "Active") {
        // Re-calculate for security
        if (couponDoc.type === "Percentage") {
          discountAmount = (totalAmount * couponDoc.value) / 100;
          if (couponDoc.maxCap) discountAmount = Math.min(discountAmount, couponDoc.maxCap);
        } else {
          discountAmount = Math.min(couponDoc.value, totalAmount);
        }
        couponId = couponDoc._id;
        
        // Increment usage
        couponDoc.usedCount += 1;
        await couponDoc.save();
      }
    }

    const finalTotal = totalAmount - discountAmount;

    // 4. Handle Wallet Payment
    if (paymentMethod === "wallet") {
      const user = await require("../models/userModel").findById(userId);
      if (user.wallet < finalTotal) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      user.wallet -= finalTotal;
      await user.save();

      // Log wallet transaction
      await Transaction.create({
        user: userId,
        amount: finalTotal,
        type: "Debit",
        description: "Order Payment via Wallet"
      });
    }

    // 5. Create the order
    const newOrder = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      totalAmount: finalTotal,
      paymentMethod,
      coupon: couponId,
      discountAmount,
      status: "Pending",
      paymentStatus: (paymentMethod === "wallet" || paymentMethod === "online") ? "Paid" : "Unpaid",
    });

    // 4. Clear user's cart
    await Cart.deleteMany({ user: userId });

    res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET MY ORDERS
========================= */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ORDER BY ID
========================= */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   CANCEL ORDER
========================= */
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Pending" && order.status !== "Processing") {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }

    // 1. Update Order Status
    order.status = "Cancelled";
    
    // 2. Handle refund if necessary (WALLET/ONLINE)
    let refundAmount = 0;
    if (order.paymentStatus === "Paid") {
      const user = await require("../models/userModel").findById(req.user.id);
      if (user) {
        user.wallet += order.totalAmount;
        await user.save();
        order.paymentStatus = "Refunded";
        refundAmount = order.totalAmount;

        // Log wallet transaction
        await Transaction.create({
          user: req.user.id,
          amount: order.totalAmount,
          type: "Credit",
          description: `Refund for Cancelled Order #${order._id.toString().slice(-6).toUpperCase()}`,
          orderId: order._id
        });
      }
    }

    await order.save();

    // 3. Create Cancellation Record
    await Cancellation.create({
      orderId: order._id,
      userId: req.user.id,
      reason: reason || "User requested cancellation",
      refundAmount: refundAmount,
      paymentMethod: order.paymentMethod,
      status: "Approved" // User-initiated cancellations on pending orders are auto-approved
    });

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   RETURN ORDER
========================= */
exports.returnOrder = async (req, res) => {
  try {
    const { reason, condition, pickupAddress, comments } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => `/uploads/returns/${file.filename}`) : [];

    order.status = "Returned";
    
    // Process wallet refund if it was paid
    let refundAmount = 0;
    if (order.paymentStatus === "Paid") {
      const user = await require("../models/userModel").findById(req.user.id);
      if (user) {
        user.wallet += order.totalAmount;
        await user.save();
        order.paymentStatus = "Refunded";
        refundAmount = order.totalAmount;

        // Log wallet transaction
        await Transaction.create({
          user: req.user.id,
          amount: order.totalAmount,
          type: "Credit",
          description: `Refund for Returned Order #${order._id.toString().slice(-6).toUpperCase()}`,
          orderId: order._id
        });
      }
    }

    await order.save();

    // Create Return Record
    await Return.create({
      orderId: order._id,
      userId: req.user.id,
      reason,
      condition,
      pickupAddress,
      comments,
      images,
      refundAmount,
      status: "Approved" // In this simple flow, we auto-approve and refund
    });

    res.json({ message: "Order returned successfully and refund processed", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ALL ORDERS (ADMIN)
========================= */
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, search, dateFilter } = req.query;

    const query = {};
    
    // Status Filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Search Filter (ID, Name, or Email)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { "shippingAddress.firstName": searchRegex },
        { "shippingAddress.lastName": searchRegex },
        { "shippingAddress.email": searchRegex },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: search,
              options: "i"
            }
          }
        }
      ];
    }

    // Date Filter
    if (dateFilter && dateFilter !== "All Dates") {
      const now = new Date();
      let startDate;

      if (dateFilter === "Today") {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (dateFilter === "This Week") {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (dateFilter === "This Month") {
        startDate = new Date(now.setDate(now.getDate() - 30));
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    const totalOrders = await Order.countDocuments({});
    const pendingCount = await Order.countDocuments({ status: "Pending" });
    const deliveredCount = await Order.countDocuments({ status: "Delivered" });
    const cancelledCount = await Order.countDocuments({ status: "Cancelled" });

    const filteredTotal = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      orders,
      pagination: {
        totalOrders: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
        currentPage: page,
        limit,
      },
      stats: {
        total: totalOrders,
        pending: pendingCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE ORDER STATUS (ADMIN)
========================= */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status === "Cancelled" && order.status !== "Cancelled") {
      await Cancellation.create({
        orderId: order._id,
        userId: order.user,
        reason: "Admin cancelled the order",
        paymentMethod: order.paymentMethod,
        status: "Approved"
      });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET CANCELLATION BY ORDER ID
========================= */
exports.getCancellationByOrderId = async (req, res) => {
  try {
    const cancellation = await Cancellation.findOne({ orderId: req.params.id });
    if (!cancellation) {
      return res.status(404).json({ message: "Cancellation details not found" });
    }
    res.json(cancellation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET RETURN BY ORDER ID
========================= */
exports.getReturnByOrderId = async (req, res) => {
  try {
    const returnRecord = await Return.findOne({ orderId: req.params.id });
    if (!returnRecord) {
      return res.status(404).json({ message: "Return record not found" });
    }
    res.json(returnRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET SINGLE ORDER (ADMIN)
========================= */
exports.getAdminOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   RAZORPAY: CREATE ORDER
========================= */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ message: "Failed to create Razorpay order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   RAZORPAY: VERIFY PAYMENT
========================= */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData // This contains shippingAddress, paymentMethod, items, totalAmount, etc.
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      // 1. Signature is valid, proceed to place order in our DB
      const userId = req.user.id;
      
      // We can reuse the logic from placeOrder but adapted for verified payment
      const { shippingAddress, paymentMethod, coupon, discountAmount, totalAmount, items } = orderData;

      const newOrder = await Order.create({
        user: userId,
        items: items,
        shippingAddress,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod, // should be "online"
        coupon: coupon || null,
        discountAmount: discountAmount || 0,
        status: "Processing",
        paymentStatus: "Paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      });

      // 2. Clear user's cart
      await Cart.deleteMany({ user: userId });

      res.status(201).json({
        message: "Payment verified and order placed successfully",
        order: newOrder,
      });
    } else {
      res.status(400).json({ message: "Invalid payment signature" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
