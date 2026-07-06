const express = require("express");
const router = express.Router();
const {
  placeOrder,
  trackOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protectAdmin, protectUser } = require("../middleware/authMiddleware");

// Public
router.post("/", placeOrder);
router.get("/track/:orderNumber", trackOrder);

// Customer
router.get("/my-orders", protectUser, getMyOrders);

// Admin
router.get("/", protectAdmin, getAllOrders);
router.put("/:id/status", protectAdmin, updateOrderStatus);

module.exports = router;
