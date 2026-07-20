const Offer = require("../models/offerModel");

// @desc    Create a new offer
// @route   POST /api/offers
// @access  Private/Admin
const createOffer = async (req, res) => {
  try {
    const { title, discountType, discountValue, offerType, targetCategory, targetProduct, description, startDate, endDate, isActive } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const image = req.file.path;

    const offer = await Offer.create({
      title,
      discountType,
      discountValue,
      offerType: offerType || "Category",
      targetCategory,
      targetProduct: targetProduct || null,
      description,
      startDate,
      endDate,
      isActive: isActive === 'false' ? false : true,
      image: image
    });

    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active offers for homepage
// @route   GET /api/offers/active
// @access  Public
const getActiveOffers = async (req, res) => {
  try {
    const now = new Date();

    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate("targetProduct").sort({ startDate: -1 });

    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all offers
// @route   GET /api/offers
// @access  Private/Admin
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({}).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an offer
// @route   PATCH /api/offers/:id
// @access  Private/Admin
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    const { title, discountType, discountValue, offerType, targetCategory, targetProduct, description, startDate, endDate, isActive } = req.body;

    offer.title = title || offer.title;
    offer.discountType = discountType || offer.discountType;
    offer.discountValue = discountValue || offer.discountValue;
    offer.offerType = offerType || offer.offerType;
    offer.targetCategory = targetCategory !== undefined ? targetCategory : offer.targetCategory;
    offer.targetProduct = targetProduct !== undefined ? targetProduct : offer.targetProduct;
    offer.description = description || offer.description;
    offer.startDate = startDate || offer.startDate;
    offer.endDate = endDate || offer.endDate;
    if (isActive !== undefined) {
      offer.isActive = isActive === 'false' ? false : true;
    }

    if (req.file) {
      offer.image = req.file.path;
    }

    const updatedOffer = await offer.save();
    res.json(updatedOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (offer) {
      await offer.deleteOne();
      res.json({ message: "Offer removed" });
    } else {
      res.status(404).json({ message: "Offer not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle offer status
// @route   PATCH /api/offers/:id/status
// @access  Private/Admin
const toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    offer.isActive = !offer.isActive;
    const updatedOffer = await offer.save();
    res.json(updatedOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOffer,
  getActiveOffers,
  getOffers,
  updateOffer,
  toggleOfferStatus,
  deleteOffer
};
