const Contact = require("../models/contactModel");

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
exports.submitMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: "Please provide all fields." });
        }

        const newMessage = new Contact({
            name,
            email,
            subject,
            message
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: "Your message has been sent successfully!"
        });
    } catch (error) {
        console.error("Error in submitMessage:", error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact/admin/all
// @access  Private/Admin
exports.getAllMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || 'all'; // all, read, unread

        let query = {};
        if (status === 'read') query.isRead = true;
        if (status === 'unread') query.isRead = false;

        const totalMessages = await Contact.countDocuments(query);
        const messages = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages
            }
        });
    } catch (error) {
        console.error("Error in getAllMessages:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// @desc    Mark message as read (Admin)
// @route   PATCH /api/contact/admin/:id/read
// @access  Private/Admin
exports.markAsRead = async (req, res) => {
    try {
        const message = await Contact.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found." });
        }

        message.isRead = true;
        await message.save();

        res.status(200).json({
            success: true,
            message: "Message marked as read."
        });
    } catch (error) {
        console.error("Error in markAsRead:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};
