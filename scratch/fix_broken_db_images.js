require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');

const MONGODB_URI = process.env.MONGO_URI;

// A generic placeholder image that looks decent for products
const PLACEHOLDER_IMG = 'https://via.placeholder.com/500x500/f3f4f6/333333?text=Soleverse+Product';

async function fixBrokenImages() {
    console.log("=== FIXING BROKEN DATABASE IMAGES ===");
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Fix Products
        console.log("\n🚀 Fixing Products...");
        const products = await Product.find({});
        let pUpdated = 0;
        for (const p of products) {
            let updateData = {};
            if (p.image && (p.image.includes('/uploads/') || p.image.includes('v1312461204/sample.jpg'))) {
                updateData.image = PLACEHOLDER_IMG;
            }
            if (p.gallery && p.gallery.length > 0) {
                const newGallery = [];
                let galleryChanged = false;
                for (const g of p.gallery) {
                    if (g.includes('/uploads/') || g.includes('v1312461204/sample.jpg')) {
                        newGallery.push(PLACEHOLDER_IMG);
                        galleryChanged = true;
                    } else {
                        newGallery.push(g);
                    }
                }
                if (galleryChanged) {
                    updateData.gallery = newGallery;
                }
            }
            if (Object.keys(updateData).length > 0) {
                await Product.updateOne({ _id: p._id }, { $set: updateData });
                pUpdated++;
            }
        }
        console.log(`✅ Fixed ${pUpdated} products.`);

        // 2. Fix Categories
        console.log("\n🚀 Fixing Categories...");
        const categories = await Category.find({});
        let cUpdated = 0;
        for (const c of categories) {
            if (c.image && (c.image.includes('/uploads/') || c.image.includes('v1312461204/sample.jpg'))) {
                await Category.updateOne({ _id: c._id }, { $set: { image: PLACEHOLDER_IMG } });
                cUpdated++;
            }
        }
        console.log(`✅ Fixed ${cUpdated} categories.`);

        // 3. Fix Offers
        console.log("\n🚀 Fixing Offers...");
        const offers = await Offer.find({});
        let oUpdated = 0;
        for (const o of offers) {
            if (o.image && (o.image.includes('/uploads/') || o.image.includes('v1312461204/sample.jpg'))) {
                await Offer.updateOne({ _id: o._id }, { $set: { image: PLACEHOLDER_IMG } });
                oUpdated++;
            }
        }
        console.log(`✅ Fixed ${oUpdated} offers.`);

        console.log("\n🎉 BROKEN IMAGES REPLACED WITH PLACEHOLDERS 🎉");
        console.log("You can now go to your Admin panel and upload the real images.");
    } catch (error) {
        console.error("❌ Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

fixBrokenImages();
