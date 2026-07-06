const express = require("express");
const router = express.Router();
const {
  loginAdmin,
  registerAdmin,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserAddress,
  getAllUsers,
  getWishlist,
  toggleWishlist,
  getCart,
  syncCart,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/authController");
const { protectAdmin, protectUser } = require("../middleware/authMiddleware");

// Admin
router.post("/login", loginAdmin);
router.post("/register", registerAdmin); // Use once to create your first admin, then consider removing/protecting this
router.get("/users", protectAdmin, getAllUsers);

// Customer Profile & Auth
router.post("/customer/register", registerUser);
router.post("/customer/login", loginUser);
router.get("/customer/me", protectUser, getUserProfile);
router.put("/customer/me/address", protectUser, updateUserAddress); // fallback address update

// Customer Wishlist
router.get("/customer/wishlist", protectUser, getWishlist);
router.post("/customer/wishlist", protectUser, toggleWishlist);

// Customer Cart
router.get("/customer/cart", protectUser, getCart);
router.post("/customer/cart", protectUser, syncCart);

// Customer Addresses Book
router.post("/customer/addresses", protectUser, addAddress);
router.put("/customer/addresses/:addressId", protectUser, updateAddress);
router.delete("/customer/addresses/:addressId", protectUser, deleteAddress);

module.exports = router;
