  const Product = require("../models/Product");

  // @desc    Get all active products (public) - with search, filter, pagination
  // @route   GET /api/products?keyword=&category=&minPrice=&maxPrice=&page=1
  const getProducts = async (req, res) => {
    try {
      const pageSize = 12;
      const page = Number(req.query.page) || 1;

      const filter = { isActive: true };

      if (req.query.keyword) {
        filter.$text = { $search: req.query.keyword };
      }

      if (req.query.category) {
        filter.category = req.query.category;
      }

      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
      }

      const count = await Product.countDocuments(filter);
      const products = await Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

      res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        total: count,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // @desc    Get single product by slug (public)
  // @route   GET /api/products/:slug
  const getProductBySlug = async (req, res) => {
    try {
      const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
        "category",
        "name slug"
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // @desc    Get all products including inactive (admin)
  // @route   GET /api/products/admin/all
  const getAllProductsAdmin = async (req, res) => {
    try {
      const products = await Product.find().populate("category", "name").sort({ createdAt: -1 });
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // @desc    Create product (admin only)
  // @route   POST /api/products
  const createProduct = async (req, res) => {
    try {
      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  // @desc    Update product (admin only)
  // @route   PUT /api/products/:id
  const updateProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      Object.assign(product, req.body);
      const updated = await product.save();
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  // @desc    Delete product (admin only)
  // @route   DELETE /api/products/:id
  const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// @desc    Add product review (public)
// @route   POST /api/products/:id/reviews
const addProductReview = async (req, res) => {
  try {
    const { name, rating, comment, images } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = {
      name,
      rating: Number(rating),
      comment,
      images: images || [],
    };

    product.reviews.push(review);
    await product.save();

    res.status(201).json({ message: "Review added successfully", reviews: product.reviews });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
};
