const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

exports.protect = async (req, res, next) => {
  // Read token from header FIRST to ensure frontend's localStorage token takes precedence
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    // Check fallback to cookie
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB to guarantee role hasn't changed
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
        return res.status(401).json({ message: "User no longer exists" });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token invalid"
    });
  }
};
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only."
    });
  }
  next();
};

exports.userOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return res.status(403).json({
      message: "Admins cannot access user features"
    });
  }
  next();
};
