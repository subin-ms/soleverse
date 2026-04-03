require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/productModel");

const migrate = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const result = await Product.updateMany(
      { stock: { $lte: 0 }, status: "Active" },
      { $set: { status: "Out of Stock" } }
    );

    console.log(`Fixed ${result.modifiedCount} products from 'Active' to 'Out of Stock'.`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

migrate();
