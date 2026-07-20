require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/productModel');

const MONGODB_URI = process.env.MONGO_URI;

async function fixStock() {
    console.log("=== FIXING PRODUCT STOCK IN DB ===");
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const products = await Product.find({});
        let updated = 0;
        
        for (const p of products) {
            if (p.sizes && Object.keys(p.sizes).length > 0) {
                const total = Object.values(p.sizes).reduce((sum, count) => sum + (Number(count) || 0), 0);
                if (p.stock !== total || (total > 0 && p.status === 'Out of Stock') || (total <= 0 && p.status === 'Active')) {
                    const newStatus = total > 0 ? 'Active' : 'Out of Stock';
                    await Product.updateOne({ _id: p._id }, { $set: { stock: total, status: newStatus } });
                    updated++;
                    console.log(`Updated ${p.name}: stock = ${total}, status = ${newStatus}`);
                }
            }
        }
        console.log(`✅ Fixed ${updated} products.`);
    } catch (error) {
        console.error("❌ Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

fixStock();
