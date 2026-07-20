require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const mongoose = require("mongoose");

// MongoDB connection is handled by connectDB() below
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
const offerRoutes = require("./routes/offerRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// ================= Middleware =================

const allowedOrigins = [
    "https://soleverse.online",
    "https://www.soleverse.online",
    "https://soleverse-plum.vercel.app",
    "https://soleverse-h0k07dvo8-subinms.vercel.app",
    "https://soleverse-uo2p.onrender.com",
    "http://localhost:3000",
    "http://localhost:5000"
];

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

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
app.use("/api/offers", offerRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error 👉", err);
    let errorStr = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
    res.status(500).json({
        message: `Error: ${errorStr} | Stack: ${err.stack || 'No stack'}`
    });
});

// Test Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "user", "index.html"));
});

// Start Server
app.listen(PORT, "0.0.0.0",() => {
  console.log(`Server running at http://localhost:${PORT}`);
});