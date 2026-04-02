const User = require("../models/userModel");
const Order = require("../models/orderModel");

const getAdminCustomers = async (req, res) => {
    try {
        const { search } = req.query;
        
        // 1. Find all users with role "user"
        let userQuery = { role: "user" };
        if (search) {
            userQuery.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(userQuery).select("-password").sort({ createdAt: -1 });

        // 2. Aggregate stats for each user
        const customerData = await Promise.all(users.map(async (user) => {
            const orders = await Order.find({ user: user._id });
            
            const totalOrders = orders.length;
            const cancellations = orders.filter(o => ["Cancelled", "Returned"].includes(o.status)).length;
            const totalSpent = orders
                .filter(o => o.status === "Delivered")
                .reduce((sum, o) => sum + o.totalAmount, 0);

            return {
                _id: user._id,
                name: user.name || "Unknown",
                email: user.email,
                joinedDate: user.createdAt,
                orders: totalOrders,
                cancellations: cancellations,
                spent: totalSpent,
                status: user.isBlocked ? "BLOCKED" : "ACTIVE",
                isBlocked: user.isBlocked
            };
        }));

        res.status(200).json({
            success: true,
            count: customerData.length,
            customers: customerData
        });

    } catch (error) {
        console.error("Error fetching admin customers:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
            isBlocked: user.isBlocked
        });
    } catch (error) {
        console.error("Error toggling block user:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getAdminCustomers,
    toggleBlockUser
};
