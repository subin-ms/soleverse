const multer = require("multer");
const path = require("path");
const { createStorage } = require("../config/cloudinary");

// Dynamic storage engine to assign different Cloudinary folders based on the route
const storage = (req, file, cb) => {
  let folder = "soleverse/misc";
  if (req.baseUrl && req.baseUrl.includes("product")) folder = "soleverse/products";
  else if (req.baseUrl && req.baseUrl.includes("categor")) folder = "soleverse/categories";
  else if (req.baseUrl && req.baseUrl.includes("order")) folder = "soleverse/returns";
  else if (req.baseUrl && req.baseUrl.includes("review")) folder = "soleverse/reviews";
  else if (req.baseUrl && req.baseUrl.includes("offer")) folder = "soleverse/offers";

  // Create a storage engine on the fly for the resolved folder
  const storageEngine = createStorage(folder);
  // Delegate the handling to the Cloudinary storage engine
  storageEngine._handleFile(req, file, cb);
};

// Create a custom storage wrapper since multer doesn't easily support dynamic engines
const customStorage = {
  _handleFile: storage,
  _removeFile: (req, file, cb) => {
    // Optional: implement if needed
    cb(null);
  }
};

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
  storage: customStorage,
  fileFilter
});

module.exports = upload;