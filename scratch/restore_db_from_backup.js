require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Return = require('../models/returnModel');
const Review = require('../models/reviewModel');

const MONGODB_URI = process.env.MONGO_URI;
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'backup-1784545403071');

async function restoreBackup() {
    console.log("=== RESTORING MONGODB BACKUP ===");
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const collections = [
            { name: 'products', model: Product },
            { name: 'categories', model: Category },
            { name: 'offers', model: Offer },
            { name: 'returns', model: Return },
            { name: 'reviews', model: Review }
        ];

        for (const col of collections) {
            const filePath = path.join(BACKUP_DIR, `${col.name}.json`);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                console.log(`Restoring ${data.length} records into ${col.name}...`);
                
                // Clear collection completely before restore
                await col.model.deleteMany({});
                
                if (data.length > 0) {
                    await col.model.insertMany(data);
                    console.log(`✅ Successfully restored ${col.name}`);
                }
            }
        }
        
        console.log("\n🎉 RESTORE COMPLETED SUCCESSFULLY 🎉");
    } catch (error) {
        console.error("❌ Restore failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

restoreBackup();
