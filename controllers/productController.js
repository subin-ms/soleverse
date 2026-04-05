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
    const { category, size, maxPrice, sort, search, page = 1, limit = 12 } = req.query;
    const Category = require("../models/categoryModel");
    const publishedCategories = await Category.find({ status: "Published" }, "_id");
    const publishedCategoryIds = publishedCategories.map(c => c._id);

    const filter = { 
        status: { $in: ["Active", "Out of Stock"] },
        category: { $in: publishedCategoryIds } 
    };
    
    if (maxPrice && Number(maxPrice) < 50000) {
      filter.price = { $lte: Number(maxPrice) };
    }

    // --- Search Filter ---
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      });
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
        
        // Use $and to combine with search or other filters
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: sizeConditions });
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
    const product = await Product.findOne({ 
      _id: req.params.id, 
      status: { $in: ["Active", "Out of Stock"] } 
    }).populate("category");
      
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

// 🔍 Get Single Product (Admin)
exports.getProductById = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Product ID format" });
    }

    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
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
    const { name, sku, price, description, category, discountType, discountValue, stock, status, sizes } = req.body;
    
    // ✅ Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (sku) updateData.sku = sku;
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (discountType) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = Number(discountValue);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (status) updateData.status = status;
    
    // ✅ Enforce stock status consistency
    const finalStock = stock !== undefined ? Number(stock) : undefined;
    if (finalStock !== undefined && finalStock <= 0 && updateData.status === "Active") {
      updateData.status = "Out of Stock";
    } else if (finalStock !== undefined && finalStock > 0 && updateData.status === "Out of Stock") {
      updateData.status = "Active";
    }

    // ✅ Update sizes
    if (sizes) {
      try { updateData.sizes = JSON.parse(sizes); } catch (e) {}
    }

    // ✅ Handle Main Image
    const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
    if (imageFile) {
      updateData.image = `/${imageFile.destination.replace(/\\/g, '/')}/${imageFile.filename}`;
    }

    // ✅ Handle Gallery Images
    const galleryFiles = req.files && req.files['gallery'] ? req.files['gallery'] : [];
    if (galleryFiles.length > 0) {
      const newGallery = galleryFiles.map(f => `/${f.destination.replace(/\\/g, '/')}/${f.filename}`);
      // Find current product to append to gallery
      const currentProduct = await Product.findById(req.params.id);
      if (currentProduct) {
        updateData.gallery = [...currentProduct.gallery, ...newGallery];
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 💎 GET SEARCH SUGGESTIONS (API)
exports.getSearchSuggestions = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
      return res.json({ products: [], categories: [] });
    }

    const searchRegex = new RegExp(query, "i");
    const Category = require("../models/categoryModel");

    // Simultaneous search for performance
    const [categories, products] = await Promise.all([
      // 1. Find matching brands/categories
      Category.find({ 
        name: searchRegex, 
        status: "Published" 
      })
      .select("name slug")
      .limit(3),

      // 2. Find matching top products
      Product.find({
        status: { $in: ["Active", "Out of Stock"] },
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      })
      .select("name price image _id discountType discountValue")
      .limit(5)
    ]);

    res.json({ categories, products });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};