require('dotenv').config();
const mongoose = require('mongoose');
const { cloudinary } = require('../config/cloudinary');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Return = require('../models/returnModel');
const Review = require('../models/reviewModel');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MONGODB_URI = process.env.MONGO_URI;

async function backupDatabase() {
    console.log("📦 Creating MongoDB Backup...");
    try {
        const backupDir = path.join(__dirname, '..', 'backups', `backup-${Date.now()}`);
        fs.mkdirSync(backupDir, { recursive: true });
        
        // Use mongoexport for each collection to keep it simple and independent of mongodump installation
        const collections = ['products', 'categories', 'offers', 'returns', 'reviews'];
        
        for (const col of collections) {
            const outputPath = path.join(backupDir, `${col}.json`);
            // We'll just read them via Mongoose and save to file since it's local code running
            // This is safer and doesn't require mongoexport installed on the machine
            let data = [];
            if (col === 'products') data = await Product.find({});
            if (col === 'categories') data = await Category.find({});
            if (col === 'offers') data = await Offer.find({});
            if (col === 'returns') data = await Return.find({});
            if (col === 'reviews') data = await Review.find({});
            
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`✅ Backed up ${data.length} records from ${col} to ${outputPath}`);
        }
        
        console.log("📦 Backup completed successfully.");
    } catch (error) {
        console.error("❌ Backup failed:", error);
        process.exit(1);
    }
}

async function uploadToCloudinary(localPath, folder) {
    try {
        const fullPath = path.join(__dirname, '..', localPath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ File not found locally: ${fullPath}`);
            return null;
        }

        const result = await cloudinary.uploader.upload(fullPath, {
            folder: folder,
            use_filename: true,
            unique_filename: false,
            overwrite: true
        });

        // Use secure_url as requested
        return result.secure_url;
    } catch (error) {
        console.error(`❌ Cloudinary upload failed for ${localPath}:`, error.message);
        return null;
    }
}

async function migrateProducts() {
    console.log("\n🚀 Migrating Products...");
    const products = await Product.find({});
    let updated = 0;
    let skipped = 0;

    for (const product of products) {
        let changed = false;

        // Migrate main image
        if (product.image && product.image.startsWith('/uploads')) {
            console.log(`Uploading ${product.image}...`);
            const secureUrl = await uploadToCloudinary(product.image, 'soleverse/products');
            if (secureUrl) {
                product.image = secureUrl;
                changed = true;
            }
        }

        // Migrate gallery
        if (product.gallery && product.gallery.length > 0) {
            const newGallery = [];
            for (const img of product.gallery) {
                if (img.startsWith('/uploads')) {
                    console.log(`Uploading gallery image ${img}...`);
                    const secureUrl = await uploadToCloudinary(img, 'soleverse/products');
                    if (secureUrl) {
                        newGallery.push(secureUrl);
                        changed = true;
                    } else {
                        newGallery.push(img); // keep old if failed
                    }
                } else {
                    newGallery.push(img);
                }
            }
            product.gallery = newGallery;
        }

        if (changed) {
            // Update MongoDB ONLY after upload succeeds
            await Product.updateOne({ _id: product._id }, { $set: { image: product.image, gallery: product.gallery } });
            updated++;
            console.log(`✅ Updated product: ${product.name}`);
        } else {
            skipped++;
        }
    }
    console.log(`Products: ${updated} updated, ${skipped} skipped.`);
}

async function migrateCategories() {
    console.log("\n🚀 Migrating Categories...");
    const categories = await Category.find({});
    let updated = 0;
    let skipped = 0;

    for (const cat of categories) {
        if (cat.image && cat.image.startsWith('/uploads')) {
            console.log(`Uploading ${cat.image}...`);
            const secureUrl = await uploadToCloudinary(cat.image, 'soleverse/categories');
            if (secureUrl) {
                cat.image = secureUrl;
                await Category.updateOne({ _id: cat._id }, { $set: { image: secureUrl } }); // Update ONLY after upload succeeds
                updated++;
                console.log(`✅ Updated category: ${cat.name}`);
            }
        } else {
            skipped++;
        }
    }
    console.log(`Categories: ${updated} updated, ${skipped} skipped.`);
}

async function migrateOffers() {
    console.log("\n🚀 Migrating Offers...");
    const offers = await Offer.find({});
    let updated = 0;
    let skipped = 0;

    for (const offer of offers) {
        // Offer image might have baseUrl prepended, e.g. http://localhost:5000/uploads/...
        if (offer.image && offer.image.includes('/uploads/')) {
            // Extract the relative path
            const relativePath = offer.image.substring(offer.image.indexOf('/uploads/'));
            console.log(`Uploading ${relativePath}...`);
            const secureUrl = await uploadToCloudinary(relativePath, 'soleverse/offers');
            if (secureUrl) {
                offer.image = secureUrl;
                await Offer.updateOne({ _id: offer._id }, { $set: { image: secureUrl } });
                updated++;
                console.log(`✅ Updated offer: ${offer.title}`);
            }
        } else {
            skipped++;
        }
    }
    console.log(`Offers: ${updated} updated, ${skipped} skipped.`);
}

async function migrateReturns() {
    console.log("\n🚀 Migrating Returns...");
    const returns = await Return.find({});
    let updated = 0;
    let skipped = 0;

    for (const ret of returns) {
        if (ret.images && ret.images.length > 0) {
            let changed = false;
            const newImages = [];
            for (const img of ret.images) {
                if (img.startsWith('/uploads')) {
                    console.log(`Uploading return image ${img}...`);
                    const secureUrl = await uploadToCloudinary(img, 'soleverse/returns');
                    if (secureUrl) {
                        newImages.push(secureUrl);
                        changed = true;
                    } else {
                        newImages.push(img);
                    }
                } else {
                    newImages.push(img);
                }
            }
            if (changed) {
                ret.images = newImages;
                await Return.updateOne({ _id: ret._id }, { $set: { images: newImages } });
                updated++;
                console.log(`✅ Updated return request: ${ret._id}`);
            } else {
                skipped++;
            }
        } else {
            skipped++;
        }
    }
    console.log(`Returns: ${updated} updated, ${skipped} skipped.`);
}

async function migrateReviews() {
    console.log("\n🚀 Migrating Reviews...");
    const reviews = await Review.find({});
    let updated = 0;
    let skipped = 0;

    for (const rev of reviews) {
        if (rev.photos && rev.photos.length > 0) {
            let changed = false;
            const newPhotos = [];
            for (const p of rev.photos) {
                if (p.startsWith('/uploads')) {
                    console.log(`Uploading review photo ${p}...`);
                    const secureUrl = await uploadToCloudinary(p, 'soleverse/reviews');
                    if (secureUrl) {
                        newPhotos.push(secureUrl);
                        changed = true;
                    } else {
                        newPhotos.push(p);
                    }
                } else {
                    newPhotos.push(p);
                }
            }
            if (changed) {
                rev.photos = newPhotos;
                await Review.updateOne({ _id: rev._id }, { $set: { photos: newPhotos } });
                updated++;
                console.log(`✅ Updated review: ${rev._id}`);
            } else {
                skipped++;
            }
        } else {
            skipped++;
        }
    }
    console.log(`Reviews: ${updated} updated, ${skipped} skipped.`);
}

async function runMigration() {
    console.log("=== STARTING CLOUDINARY MIGRATION ===");
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // 1. BACKUP DATABASE FIRST
        await backupDatabase();

        // 2. MIGRATE COLLECTIONS (Updating DB ONLY after upload succeeds)
        await migrateProducts();
        await migrateCategories();
        await migrateOffers();
        await migrateReturns();
        await migrateReviews();

        console.log("\n🎉 MIGRATION COMPLETED SUCCESSFULLY 🎉");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

runMigration();
