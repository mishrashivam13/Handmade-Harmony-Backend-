const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Helper: upload a single buffer to Cloudinary and return the result
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "handmade-harmony/products" },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// @desc    Upload one or more images (admin only)
// @route   POST /api/upload
// Accepts multipart/form-data with field name "images" (can send multiple files)
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadPromises = req.files.map((file) => streamUpload(file.buffer));
    const results = await Promise.all(uploadPromises);

    const urls = results.map((result) => result.secure_url);

    res.status(201).json({ urls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Image upload failed", error: error.message });
  }
};

module.exports = { uploadImages };