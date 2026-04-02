const Order = require("../models/orderModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

/**
 * Get Dashboard Statistics
 * GET /api/dashboard/stats?range=7days|30days
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const { range } = req.query;
        const now = new Date();
        let startDate = null;

        if (range === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (range === '7days') {
            startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (range === '1month') {
            startDate = new Date(now.setMonth(now.getMonth() - 1));
        } else if (range === '6months') {
            startDate = new Date(now.setMonth(now.getMonth() - 6));
        } else if (range === '1year') {
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        } else if (range === 'alltime') {
            const firstOrder = await Order.findOne().sort({ createdAt: 1 });
            startDate = firstOrder ? new Date(firstOrder.createdAt) : null;
            if (startDate) startDate.setHours(0, 0, 0, 0); // Start of that day
        } else {
            // Default to 7 days
            startDate = new Date(now.setDate(now.getDate() - 7));
        }

        const dateQuery = startDate ? { createdAt: { $gte: startDate } } : {};

        // 1. Net Sales (Successful orders only)
        const netSalesResult = await Order.aggregate([
            { $match: { ...dateQuery, status: "Delivered" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const netSales = netSalesResult[0]?.total || 0;

        // 2. Total Orders
        const totalOrders = await Order.countDocuments(dateQuery);

        // 3. New Customers
        const newCustomers = await User.countDocuments({ 
            ...dateQuery,
            role: "user"
        });

        // 4. Chart Data (Items Status Breakdown)
        const rawChartData = await Order.aggregate([
            { $match: dateQuery },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    successful: {
                        $sum: { $cond: [{ $in: ["$status", ["Pending", "Processing", "Shipped", "Delivered"]] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $in: ["$status", ["Cancelled", "Returned"]] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Fix: Transform array into the { labels: [], successful: [], cancelled: [] } structure the frontend expects
        const labels = [];
        const successful = [];
        const cancelled = [];

        // Determine if we should group by month for long ranges (optimization)
        const isLongRange = range === 'alltime' && startDate && (new Date() - startDate) > (90 * 24 * 60 * 60 * 1000);

        if (isLongRange) {
            // Re-aggregate by month for better performance/visualization
            const monthlyData = await Order.aggregate([
                { $match: dateQuery },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        successful: {
                            $sum: { $cond: [{ $in: ["$status", ["Pending", "Processing", "Shipped", "Delivered"]] }, 1, 0] }
                        },
                        cancelled: {
                            $sum: { $cond: [{ $in: ["$status", ["Cancelled", "Returned"]] }, 1, 0] }
                        }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            monthlyData.forEach(item => {
                labels.push(item._id);
                successful.push(item.successful);
                cancelled.push(item.cancelled);
            });
        } else if (startDate) {
            // Daily breakdown for shorter ranges (with gap filling)
            const dataMap = new Map(rawChartData.map(d => [d._id, d]));
            const tempDate = new Date(startDate);
            const endDate = new Date();

            while (tempDate <= endDate) {
                const dateStr = tempDate.toISOString().split('T')[0];
                const entry = dataMap.get(dateStr) || { successful: 0, cancelled: 0 };
                
                labels.push(dateStr);
                successful.push(entry.successful);
                cancelled.push(entry.cancelled);
                
                tempDate.setDate(tempDate.getDate() + 1);
            }
        } else {
            // Fallback for no data
            rawChartData.forEach(item => {
                labels.push(item._id);
                successful.push(item.successful);
                cancelled.push(item.cancelled);
            });
        }

        res.status(200).json({
            success: true,
            stats: { netSales, totalOrders, newCustomers },
            chartData: { labels, successful, cancelled }
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
