// Set up Multer for handling image uploads
const multer = require("multer");
const path = require("path");

// Configure Multer storage location and filename
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "/itemImage")); // Folder where images are saved
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname; // Unique filename
    cb(null, name);
  }
});

const upload = multer({ storage: imageStorage }); // Use the storage config


module.exports = upload