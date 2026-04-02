const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

/* =========================
   ADD CATEGORY (ADMIN)
========================= */
exports.addCategory = async (req, res) => {
  try {
    const name = req.body?.name;
    const slug = req.body?.slug;
    const description = req.body?.description;
    const status = req.body?.status;

    if (!name || !slug) {
      return res.status(400).json({
        message: "Category name and slug are required"
      });
    }

    const image = req.file
      ? `/uploads/categories/${req.file.filename}`
      : null;

    const category = await Category.create({
      name,
      slug,
      description,
      status: status || "Draft",
      image
    });

    res.status(201).json({
      message: "Category added successfully",
      category
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================
   GET ALL CATEGORIES (ADMIN)
========================= */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id });

        return {
          ...cat.toObject(),
          totalProducts: productCount
        };
      })
    );

    res.json(categoriesWithCounts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================
   GET PUBLISHED CATEGORIES (USER SIDE)
========================= */
exports.getPublishedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: "Published" })
      .sort({ createdAt: -1 });

    res.json(categories);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================
   UPDATE CATEGORY (ADMIN)
========================= */
exports.updateCategory = async (req, res) => {
  try {
    const name = req.body?.name;
    const slug = req.body?.slug;
    const description = req.body?.description;
    const status = req.body?.status;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // ✅ Update image if new file uploaded
    if (req.file) {
      category.image = `/uploads/categories/${req.file.filename}`;
    }
    // ✅ Update other fields
    category.name = name || category.name;
    category.slug = slug || category.slug;
    category.description =
      description !== undefined ? description : category.description;
    category.status = status || category.status;

    await category.save();

    res.json({
      message: "Category updated successfully",
      category
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================
   TOGGLE CATEGORY STATUS (ADMIN)
========================= */
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.status = category.status === "Published" ? "Draft" : "Published";
    await category.save();

    res.json({
      message: `Category ${category.status === "Published" ? "Published" : "Disabled"} successfully`,
      category
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};