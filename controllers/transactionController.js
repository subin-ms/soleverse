const Order = require("../models/orderModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");

/* =========================
   GET ALL TRANSACTIONS (ADMIN)
   ========================= */
exports.getTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { type, range, search } = req.query;

        const query = {};

        // Type Filter (Credit / Debit)
        if (type === 'Credit') {
            query.paymentStatus = 'Paid';
        } else if (type === 'Debit') {
            query.paymentStatus = 'Refunded';
        }

        // Date Range Filter
        if (range && range !== 'alltime') {
            const now = new Date();
            let startDate;
            if (range === 'today') {
                startDate = new Date(now.setHours(0, 0, 0, 0));
            } else if (range === '1m') {
                startDate = new Date(now.setMonth(now.getMonth() - 1));
            } else if (range === '6m') {
                startDate = new Date(now.setMonth(now.getMonth() - 6));
            } else if (range === '1y') {
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            }
            if (startDate) {
                query.createdAt = { $gte: startDate };
            }
        }

        // Search Filter (User Name or ID)
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { "shippingAddress.firstName": searchRegex },
                { "shippingAddress.lastName": searchRegex },
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

        const totalTransactions = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate("user", "name email")
            .populate("items.product")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Transform Orders into Transactions for the UI
        const transactions = orders.map(order => {
            const isRefunded = order.paymentStatus === 'Refunded';
            const shortId = order._id.toString().slice(-6).toUpperCase();
            
            // Format Items: "Product A (x1), Product B (x2)"
            const itemsSummary = order.items.map(item => {
                const name = item.product ? item.product.name : 'Unknown Product';
                return `${name} (x${item.quantity})`;
            }).join(', ');

            // Logic: For COD, status is 'Success' only if order is 'Delivered'
            // Logic: Handle Cancelled orders first, then Refunded, then Success/Pending
            let displayStatus = 'Success';
            if (order.status === 'Cancelled') {
                displayStatus = 'Cancelled';
            } else if (isRefunded) {
                displayStatus = 'Refunded';
            } else if (order.paymentMethod.toLowerCase() === 'cod' && order.status !== 'Delivered') {
                displayStatus = 'Pending';
            }

            return {
                id: order._id,
                trxDisplayId: `${isRefunded ? 'REF' : 'TRX'}-${shortId}`,
                date: order.createdAt,
                customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim(),
                items: itemsSummary,
                method: order.paymentMethod, // cod, wallet, online, bank
                type: isRefunded ? 'Debit' : 'Credit',
                amount: order.totalAmount,
                status: displayStatus
            };
        });

        res.status(200).json({
            success: true,
            transactions,
            pagination: {
                total: totalTransactions,
                totalPages: Math.ceil(totalTransactions / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.error("Error in getTransactions:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   GET MY TRANSACTIONS (USER)
   ========================= */
exports.getMyTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            transactions
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   RAZORPAY: ADD FUNDS ORDER
   ========================= */
exports.addFundsRazorpay = async (req, res) => {
    try {
        const { amount } = req.body;
        
        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `wallet_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================
   RAZORPAY: VERIFY ADD FUNDS
   ========================= */
exports.verifyAddFunds = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            const user = await User.findById(req.user.id);
            user.wallet += parseFloat(amount);
            await user.save();

            // Log Transaction
            await Transaction.create({
                user: req.user.id,
                amount: amount,
                type: "Credit",
                description: "Funds added via Razorpay",
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            });

            res.status(200).json({ success: true, message: "Funds added successfully", wallet: user.wallet });
        } else {
            res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
