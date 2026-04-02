const Coupon = require('../models/couponModel');

// @desc    Get all coupons
// @route   GET /api/coupons
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: coupons.length,
            data: coupons
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new coupon
// @route   POST /api/coupons
exports.createCoupon = async (req, res) => {
    try {
        const { 
            code, title, description, type, value, minPurchase, 
            maxCap, allowOnSale, applicableOn, applicableIds, usageLimit, 
            perUserLimit, startDate, expiryDate, status, isVisible 
        } = req.body;

        // Validation
        if (!code || !title || !value || !startDate || !expiryDate) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        if (new Date(expiryDate) <= new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'Expiry date must be after start date' });
        }

        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            code, title, description, type, value, minPurchase, 
            maxCap, allowOnSale, applicableOn, applicableIds, usageLimit, 
            perUserLimit, startDate, expiryDate, status, isVisible 
        });

        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        console.error("Create Coupon Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
exports.updateCoupon = async (req, res) => {
    try {
        const { startDate, expiryDate } = req.body;
        
        if (startDate && expiryDate && new Date(expiryDate) <= new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'Expiry date must be after start date' });
        }

        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET PUBLIC VISIBLE COUPONS
exports.getPublicCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            isVisible: true,
            status: 'Active',
            startDate: { $lte: now },
            expiryDate: { $gte: now }
        }).select('code title description type value minPurchase maxCap applicableOn');
        
        res.json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// VALIDATE COUPON
exports.validateCoupon = async (req, res) => {
    try {
        const { code, cartItems, subtotal } = req.body;
        const userId = req.user.id;
        const now = new Date();

        const coupon = await Coupon.findOne({ 
            code: code.toUpperCase(),
            status: 'Active',
            startDate: { $lte: now },
            expiryDate: { $gte: now }
        });

        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid or expired coupon code" });
        }

        if (subtotal < coupon.minPurchase) {
            return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` });
        }

        // Check total usage limit
        if (coupon.usedCount >= coupon.usageLimit) {
             return res.status(400).json({ success: false, message: "This coupon is no longer available" });
        }

        // Check per-user limit (Requires Order model lookup)
        const Order = require('../models/orderModel');
        const userUsage = await Order.countDocuments({ user: userId, coupon: coupon._id });
        if (userUsage >= coupon.perUserLimit) {
            return res.status(400).json({ success: false, message: "You have already used this coupon" });
        }

        // Check targeting (Specific Products/Categories)
        if (coupon.applicableOn === 'Specific Products' || coupon.applicableOn === 'Specific Categories') {
            const isMatch = cartItems.some(item => {
                if (coupon.applicableOn === 'Specific Products') {
                    return coupon.applicableIds.some(id => id.toString() === item.product.toString());
                } else {
                    // Category check (assumes item.category is passed or need to check product model)
                    return coupon.applicableIds.some(id => id.toString() === item.category.toString());
                }
            });

            if (!isMatch) {
                return res.status(400).json({ success: false, message: `This coupon is only valid for specific ${coupon.applicableOn === 'Specific Products' ? 'products' : 'categories'}` });
            }
        }

        // Calculate Discount
        let discount = 0;
        if (coupon.type === 'Percentage') {
            discount = (subtotal * coupon.value) / 100;
            if (coupon.maxCap) discount = Math.min(discount, coupon.maxCap);
        } else {
            discount = Math.min(coupon.value, subtotal);
        }

        res.json({ 
            success: true, 
            message: "Coupon applied successfully",
            data: {
                couponId: coupon._id,
                code: coupon.code,
                discount: discount
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle Coupon Status
// @route   PATCH /api/coupons/:id/status
exports.toggleStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        coupon.status = coupon.status === 'Active' ? 'Inactive' : 'Active';
        await coupon.save();

        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Toggle Coupon Visibility
// @route   PATCH /api/coupons/:id/visibility
exports.toggleVisibility = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        coupon.isVisible = !coupon.isVisible;
        await coupon.save();

        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
