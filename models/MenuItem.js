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
    groupName: { type: String, required: true }, // e.g. "Add a Drink", "Choose your flavours"
    required: { type: Boolean, default: false },   // must customer pick at least one?
    multiSelect: { type: Boolean, default: false }, // can pick more than one option?

    // controls whether options show a price field or a quantity field
    mode: {
      type: String,
      enum: ["price", "quantity"],
      default: "price",
    },

    // ---- "price" mode only ----
    // max number of different options the customer can select
    maxSelect: {
      type: Number,
      default: null,
    },

    // ---- "quantity" mode only ----
    // customers move in multiples of this (e.g. 2 = croissants in pairs)
    step: { type: Number, default: 1, min: 1 },

    // a chosen option must be at least this many (e.g. 2 per flavour)
    minPerOption: { type: Number, default: 0, min: 0 },

    // optional cap per option, null = no cap
    maxPerOption: { type: Number, default: null },

    // max number of DIFFERENT options, e.g. 6 flavours
    maxOptions: { type: Number, default: null },

    // the bundle size, e.g. 12 pieces
    totalQty: { type: Number, default: null },

    // "exact" = must add up to totalQty, "upTo" = totalQty is a ceiling
    totalRule: {
      type: String,
      enum: ["exact", "upTo"],
      default: "exact",
    },

    options: [
      {
        label: { type: String, required: true }, // e.g. "Orange Juice" or "Nutella"
        price: { type: Number, default: 0 },     // used only when mode = "price"
        maxQuantity: { type: Number, default: null }, // per-option cap, overrides maxPerOption
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