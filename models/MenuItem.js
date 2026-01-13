// models/MenuItem.js
import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
    servingInfo: {
  type: String,
  trim: true,
  default: "",
},


    festival: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Festival",
  default: null,
},

branches: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  }
],

preorder: {
  enabled: { type: Boolean, default: false },
  minDays: { type: Number, default: 0 }, // e.g. 2 days
  prepaidRequired: { type: Boolean, default: false },
},


    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
    },

    images: [{ type: String }],

    variants: [
      {
        label: String,
        price: Number,
      },
    ],

    isAvailable: {
      type: Boolean,
      default: true,
    },

    inStock: {
      type: Boolean,
      default: true,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
