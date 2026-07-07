const Order = require("../models/Order");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

// Generate a simple unique order number like HH-20260704-1234
const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `HH-${dateStr}-${random}`;
};

// @desc    Place a new order (public - guest or logged-in checkout)
// @route   POST /api/orders
const placeOrder = async (req, res) => {
  try {
    const { items, customer, paymentMethod, notes, couponCode, giftWrap, giftMessage } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Optional: link user if authenticated request
    let userId = undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // ignore invalid token, fallback to guest order
      }
    }

    // Recalculate total on server side using DB prices (never trust client-sent total)
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant || "",
        image: product.images[0] || "",
        customYarnColor: item.customYarnColor || "",
        customText: item.customText || "",
      });
    }

    // Apply Coupon Code discount on item subtotal
    let discountAmount = 0;
    if (couponCode) {
      const cleanCoupon = couponCode.trim().toUpperCase();
      if (cleanCoupon === "WELCOME10") {
        discountAmount = Math.round(totalAmount * 0.10);
      } else if (cleanCoupon === "HARMONY15") {
        discountAmount = Math.round(totalAmount * 0.15);
      } else if (cleanCoupon === "CREATION20") {
        discountAmount = Math.round(totalAmount * 0.20);
      }
    }

    // Apply Gift Wrap Fee (+40)
    let finalAmount = totalAmount - discountAmount;
    if (giftWrap) {
      finalAmount += 40;
    }

    const order = await Order.create({
      user: userId,
      orderNumber: generateOrderNumber(),
      items: orderItems,
      customer,
      totalAmount: finalAmount,
      paymentMethod: paymentMethod || "COD",
      notes: notes || "",
      couponCode: couponCode || "",
      discountAmount,
      giftWrap: !!giftWrap,
      giftMessage: giftMessage || "",
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get order by order number (public - for customer to check status)
// @route   GET /api/orders/track/:orderNumber
const trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (admin only)
// @route   GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.orderStatus = req.query.status;
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders (customer only)
// @route   GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = req.body.orderStatus || order.orderStatus;
    order.paymentStatus = req.body.paymentStatus || order.paymentStatus;

    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  placeOrder,
  trackOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
};
