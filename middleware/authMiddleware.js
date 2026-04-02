const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  // Read token from header FIRST to ensure frontend's localStorage token takes precedence
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
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

    // decoded = { id, role, iat, exp }
    req.user = decoded;

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
