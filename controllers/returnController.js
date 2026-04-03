const Return = require("../models/returnModel");
const Order = require("../models/orderModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");

/* =========================
   GET ALL RETURNS (ADMIN)
========================= */
exports.getAllReturns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const query = {};

    if (status && status !== "") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      // Search by reason or lookup by orderId placeholder logic
      // In a real scenario, we might need aggregation for deeper search
      query.$or = [
        { reason: searchRegex },
        { pickupAddress: searchRegex },
      ];
    }

    const totalReturns = await Return.countDocuments(query);
    const returns = await Return.find(query)
      .populate("userId", "name email")
      .populate({
        path: "orderId",
        select: "orderId totalAmount paymentStatus shippingAddress items"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      status: "success",
      data: {
        returns,
        total: totalReturns,
        totalPages: Math.ceil(totalReturns / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

/* =========================
   UPDATE RETURN STATUS (ADMIN)
========================= */
exports.updateReturnStatus = async (req, res) => {
  try {
    const { status, adminComment } = req.body;
    const returnRequest = await Return.findById(req.params.id).populate("orderId");

    if (!returnRequest) {
      return res.status(404).json({ status: "error", message: "Return request not found" });
    }

    // If status is being changed to Approved, handle refund if not already done
    if (status === "Approved" && returnRequest.status === "Pending") {
      const order = returnRequest.orderId;
      if (order && order.paymentStatus === "Paid") {
        const user = await User.findById(returnRequest.userId);
        if (user) {
          user.wallet += order.totalAmount;
          await user.save();

          // Update order status/payment status
          order.paymentStatus = "Refunded";
          order.status = "Returned";
          await order.save();

          // Log transaction
          await Transaction.create({
            user: user._id,
            amount: order.totalAmount,
            type: "Credit",
            description: `Refund for Approved Return #${returnRequest._id.toString().slice(-6).toUpperCase()}`,
            orderId: order._id
          });
          
          returnRequest.refundAmount = order.totalAmount;
        }
      }
      returnRequest.status = "Refunded"; // Using Refunded to match frontend's final state
    } else {
        returnRequest.status = status;
    }

    if (adminComment) {
        returnRequest.comments = adminComment;
    }

    await returnRequest.save();

    res.json({
      status: "success",
      message: "Return status updated successfully",
      data: returnRequest,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
