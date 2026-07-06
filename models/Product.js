const mongoose = require("mongoose");
const slugify = require("slugify");

// Review Schema
const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { type: [String], default: [] }, // array of customer upload review image URLs
  },
  { timestamps: true }
);

// For variants like size/color - optional, crochet items often have this
const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Size" or "Color"
    value: { type: String, required: true }, // e.g. "Small" or "Red"
    priceAdjustment: { type: Number, default: 0 }, // extra cost for this variant, if any
    stock: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
    },
    images: {
      type: [String], // array of image URLs
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    isCustomizable: {
      type: Boolean,
      default: false, // true if customer can request custom color/size
    },
    isActive: {
      type: Boolean,
      default: true, // admin can hide product without deleting
    },
    isFeatured: {
      type: Boolean,
      default: false, // to highlight on homepage
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + "-" + Date.now().toString().slice(-5);
  }

  // Dynamically calculate average rating and reviewCount whenever reviews array changes
  if (this.isModified("reviews")) {
    this.reviewCount = this.reviews.length;
    if (this.reviewCount > 0) {
      const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
      this.rating = Number((sum / this.reviewCount).toFixed(1));
    } else {
      this.rating = 0;
    }
  }
  next();
});

// Index for search
productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
