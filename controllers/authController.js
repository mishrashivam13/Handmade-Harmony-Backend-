const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Login admin
// @route   POST /api/auth/login
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        username: admin.username,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new admin (run once for setup, then remove/protect this route)
// @route   POST /api/auth/register
const registerAdmin = async (req, res) => {
  try {
    const { name, username, password } = req.body;

    const adminExists = await Admin.findOne({ username });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({ name, username, password });
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      username: admin.username,
      token: generateToken(admin._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const User = require("../models/User");

// @desc    Register a new customer
// @route   POST /api/auth/customer/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      shippingAddress: user.shippingAddress,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login customer
// @route   POST /api/auth/customer/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        shippingAddress: user.shippingAddress,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer profile
// @route   GET /api/auth/customer/me
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update customer shipping address
// @route   PUT /api/auth/customer/me/address
const updateUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.shippingAddress = {
        street: req.body.street || user.shippingAddress.street,
        city: req.body.city || user.shippingAddress.city,
        state: req.body.state || user.shippingAddress.state,
        zipCode: req.body.zipCode || user.shippingAddress.zipCode,
        phone: req.body.phone || user.shippingAddress.phone,
      };

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        shippingAddress: updatedUser.shippingAddress,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all registered users (admin only)
// @route   GET /api/auth/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer wishlist
// @route   GET /api/auth/customer/wishlist
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle customer wishlist item
// @route   POST /api/auth/customer/wishlist
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    const index = user.wishlist.indexOf(productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer cart
// @route   GET /api/auth/customer/cart
const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");
    const cartItems = (user.cart || [])
      .map((item) => {
        if (!item.product) return null;
        return {
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images?.[0] || "",
          slug: item.product.slug,
          quantity: item.quantity,
          selectedVariant: item.selectedVariant || "",
          customYarnColor: item.customYarnColor || "",
          customText: item.customText || "",
        };
      })
      .filter(Boolean);
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync customer cart
// @route   POST /api/auth/customer/cart
const syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    const user = await User.findById(req.user._id);
    user.cart = (items || []).map((i) => ({
      product: i.productId,
      quantity: i.quantity,
      selectedVariant: i.selectedVariant || "",
      customYarnColor: i.customYarnColor || "",
      customText: i.customText || "",
    }));
    await user.save();
    res.json({ message: "Cart synced successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add shipping address
// @route   POST /api/auth/customer/addresses
const addAddress = async (req, res) => {
  try {
    const { label, street, city, state, zipCode, phone } = req.body;
    const user = await User.findById(req.user._id);
    user.shippingAddresses.push({ label, street, city, state, zipCode, phone });
    await user.save();
    res.status(201).json(user.shippingAddresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update shipping address
// @route   PUT /api/auth/customer/addresses/:addressId
const updateAddress = async (req, res) => {
  try {
    const { label, street, city, state, zipCode, phone } = req.body;
    const user = await User.findById(req.user._id);
    const address = user.shippingAddresses.id(req.params.addressId);
    if (address) {
      address.label = label || address.label;
      address.street = street || address.street;
      address.city = city || address.city;
      address.state = state || address.state;
      address.zipCode = zipCode || address.zipCode;
      address.phone = phone || address.phone;
      await user.save();
      res.json(user.shippingAddresses);
    } else {
      res.status(404).json({ message: "Address not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete shipping address
// @route   DELETE /api/auth/customer/addresses/:addressId
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.shippingAddresses.pull(req.params.addressId);
    await user.save();
    res.json(user.shippingAddresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
