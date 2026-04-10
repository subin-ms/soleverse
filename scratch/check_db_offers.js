const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const OfferSchema = new mongoose.Schema({
    title: String,
    isActive: Boolean,
    startDate: Date,
    endDate: Date
});

const Offer = mongoose.model('Offer', OfferSchema);

async function checkOffers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const offers = await Offer.find({});
        console.log("Current Offers in DB:");
        console.log(JSON.stringify(offers, null, 2));
        console.log("\nServer Time (now):", new Date());
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOffers();
