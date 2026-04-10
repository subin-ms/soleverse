const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "uploads/";
    if (req.baseUrl && req.baseUrl.includes("product")) {
      folder += "products";
    } else if (req.baseUrl && req.baseUrl.includes("categor")) {
      folder += "categories";
    } else if (req.baseUrl && req.baseUrl.includes("order")) {
      folder += "returns";
    } else if (req.baseUrl && req.baseUrl.includes("review")) {
      folder += "reviews";
    } else if (req.baseUrl && req.baseUrl.includes("offer")) {
      folder += "offers";
    } else {
      folder += "misc";
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

// Allow only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;