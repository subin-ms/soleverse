const Product = require("../models/productModel");

// ➕ Add Product
exports.addProduct = async (req, res) => {
  try {
    const { name, sku, price, description, category, discountType, discountValue, stock, status, sizes } = req.body;
    
    let parsedSizes = {};
    if (sizes) {
      try { parsedSizes = JSON.parse(sizes); } catch(e) {}
    }

    // ✅ Get image from multer
    const imageFile = req.files && req.files['image'] ? req.files['image'][0] : (req.file ? req.file : null);
    const image = imageFile
      ? `/${imageFile.destination.replace(/\\/g, '/')}/${imageFile.filename}`
      : null;

    // ✅ Get gallery images from multer
    const galleryFiles = req.files && req.files['gallery'] ? req.files['gallery'] : [];
    const gallery = galleryFiles.map(f => `/${f.destination.replace(/\\/g, '/')}/${f.filename}`);

    const product = await Product.create({
      name,
      sku,
      price: Number(price) || 0,
      description,
      category,
      discountType,
      discountValue: Number(discountValue) || 0,
      image,
      gallery,
      sizes: parsedSizes,
      stock: Number(stock) || 0,   // ✅ FIX HERE
      status
    });

    res.status(201).json({
      message: "Product added successfully",
      product
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// 🔍 Get Products
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get Public Products (only active)
exports.getPublicProducts = async (req, res) => {
  try {
    const { category, size, maxPrice, sort, page = 1, limit = 9 } = req.query;
    const Category = require("../models/categoryModel");
    const publishedCategories = await Category.find({ status: "Published" }, "_id");
    const publishedCategoryIds = publishedCategories.map(c => c._id);

    const filter = { 
        status: "Active",
        category: { $in: publishedCategoryIds } 
    };
    
    if (maxPrice && Number(maxPrice) < 1000) {
      filter.price = { $lte: Number(maxPrice) };
    }

    // --- Category Filter ---
    if (category) {
      let catId = null;
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        catId = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) catId = categoryDoc._id;
      }

      // Final check: Is this category ID in our published list?
      if (catId && publishedCategoryIds.some(id => id.toString() === catId.toString())) {
        filter.category = catId;
      } else {
        // If the specific category is draft or non-existent, return no products for it
        filter.category = new (require("mongoose")).Types.ObjectId(); 
      }
    }

    // --- Size Filter ---
    if (size) {
      // sizes can come as a string "41,42" or array ["41", "42"] depending on how it's sent
      const sizesArray = Array.isArray(size) ? size : size.split(',').map(s => s.trim());
      
      if (sizesArray.length > 0) {
        // Construct an $or array to find products where at least one of the selected sizes has stock > 0
        const sizeConditions = sizesArray.map(s => {
          const condition = {};
          condition[`sizes.${s}`] = { $gt: 0 };
          return condition;
        });
        
        // If there are other $or conditions later, need to use $and to combine them. 
        // For now, attaching directly to filter.$or is fine assuming no other $or exist.
        filter.$or = sizeConditions;
      }
    }

    // --- Sorting Logic ---
    let sortOption = { createdAt: -1 }; // Default: Newest first
    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    } else if (sort === "newest") {
      sortOption = { createdAt: -1 };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.json({
      products,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
      totalProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get Single Public Product
exports.getPublicProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, status: "Active" })
      .populate("category");
      
    if (!product) {
      return res.status(404).json({ message: "Product not found or not active" });
    }

    // Check if category is Published
    if (product.category && product.category.status !== "Published") {
        return res.status(404).json({ message: "Product category is not active" });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ✏️ UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.status = req.body.status || product.status;

    await product.save();

    res.json({
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};