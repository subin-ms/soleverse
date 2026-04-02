const Address = require("../models/addressModel");

// Get all addresses for logged in user
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new address
exports.addAddress = async (req, res) => {
  try {
    const { firstName, lastName, phone, street, apartment, city, state, pincode, isDefault } = req.body;
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const newAddress = await Address.create({
      user: req.user.id,
      firstName,
      lastName,
      phone,
      street,
      apartment,
      city,
      state,
      pincode,
      isDefault: isDefault || false
    });

    res.status(201).json(newAddress);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedAddress) return res.status(404).json({ message: "Address not found" });
    res.json(updatedAddress);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const deletedAddress = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedAddress) return res.status(404).json({ message: "Address not found" });
    res.json({ message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
