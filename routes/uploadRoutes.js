const express = require("express");
const router = express.Router();
const { uploadImages } = require("../controllers/uploadController");
const upload = require("../middleware/uploadMiddleware");
const { protectAdmin } = require("../middleware/authMiddleware");

// Admin only - upload up to 5 images at once
router.post("/", protectAdmin, upload.array("images", 5), uploadImages);

// Public - upload up to 3 images at once for reviews
router.post("/public", upload.array("images", 3), uploadImages);

module.exports = router;