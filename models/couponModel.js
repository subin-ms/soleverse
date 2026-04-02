const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['Percentage', 'Fixed'],
        default: 'Percentage'
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    minPurchase: {
        type: Number,
        default: 0,
        min: 0
    },
    maxCap: {
        type: Number,
        default: null,
        min: 0
    },
    allowOnSale: {
        type: Boolean,
        default: false
    },
    applicableOn: {
        type: String,
        default: 'Everywhere'
    },
    applicableIds: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    },
    usageLimit: {
        type: Number,
        default: 100,
        min: 1
    },
    perUserLimit: {
        type: Number,
        default: 1,
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to automatically set status based on expiry date
couponSchema.pre('save', async function() {
    const now = new Date();
    if (this.expiryDate && this.expiryDate < now) {
        this.status = 'Inactive';
    }
});

module.exports = mongoose.model('Coupon', couponSchema);
