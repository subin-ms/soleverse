require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const addressRoutes = require("./routes/addressRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const customerRoutes = require("./routes/customerRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const couponRoutes = require("./routes/couponRoutes");
const contactRoutes = require("./routes/contactRoutes");
const returnRoutes = require("./routes/returnRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// ================= Middleware =================

app.use(
  cors({
    origin: ["http://127.0.0.1:5500","http://localhost:5500"],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Serve uploads folder (VERY IMPORTANT)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Optional: public folder
app.use(express.static(path.join(__dirname, "public")));

// ================= Routes =================

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/returns", returnRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Soleverse backend running");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});