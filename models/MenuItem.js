// models/MenuItem.js
import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    isPromoEligible: {
  type: Boolean,
  default: false,
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


    addOns: [
  {
    groupName: { type: String, required: true }, // e.g. "Add a Drink", "Choose up to 6 flavours"
    required: { type: Boolean, default: false },   // must customer pick at least one?
    multiSelect: { type: Boolean, default: false }, // can pick more than one option?

    // NEW: controls whether options show a price field or a quantity field
    mode: {
      type: String,
      enum: ["price", "quantity"],
      default: "price",
    },

    // NEW: overall limit for this group
    // - in "price" mode: max number of different options customer can select
    // - in "quantity" mode: max total quantity across all options (e.g. 12 pcs)
    maxSelect: {
      type: Number,
      default: null,
    },

    options: [
      {
        label: { type: String, required: true }, // e.g. "Orange Juice" or "Nutella"
        price: { type: Number, default: 0 },       // used only when group mode = "price"
        maxQuantity: { type: Number, default: null }, // optional per-option cap, used only when mode = "quantity"
      },
    ],
  },
],

    isAvailable: {
      type: Boolean,
      default: true,
    },

    // inStock: {
    //   type: Boolean,
    //   default: true,
    // },

    stock: {
  type: Number,
  default: 0,
  min: 0,
},



    isBestSeller: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
