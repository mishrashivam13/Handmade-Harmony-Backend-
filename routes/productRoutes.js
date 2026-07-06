const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
} = require("../controllers/productController");
const { protectAdmin } = require("../middleware/authMiddleware");

// Public
router.get("/", getProducts);
router.post("/:id/reviews", addProductReview);

// Admin (must come before "/:slug" so it isn't swallowed by the wildcard route)
router.get("/admin/all", protectAdmin, getAllProductsAdmin);
router.post("/", protectAdmin, createProduct);
router.put("/:id", protectAdmin, updateProduct);
router.delete("/:id", protectAdmin, deleteProduct);

// Public (wildcard - must be last)
router.get("/:slug", getProductBySlug);

module.exports = router;
