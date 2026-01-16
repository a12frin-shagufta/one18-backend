import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    fulfillmentType: {
      type: String,
      enum: ["pickup", "delivery"],
      required: true,
    },

    orderType: {
      type: String,
      enum: ["WALK_IN", "PREORDER"],
      required: true,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
    },

    // ✅ CUSTOMER FULL DATA
    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      company: { type: String },
      phone: { type: String, required: true },

      // ✅ delivery fields
      address: { type: String, required: true },
      apartment: { type: String },
      postalCode: { type: String, required: true },

      // ✅ instructions from cart drawer
      message: { type: String },
    },

    // ✅ fulfillment date & time (what customer selected)
    fulfillmentDate: { type: String, required: true }, // "2026-01-15"
    fulfillmentTime: { type: String, required: true }, // "14:00"

    // ✅ delivery info (optional)
    deliveryAddress: {
      addressText: { type: String },
      postalCode: { type: String },
    },

    // ✅ pickup info (optional)
    pickupLocation: {
      name: { type: String },
      address: { type: String },
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        name: String,
        variant: String,
        price: Number,
        qty: Number,
      },
    ],

    subtotal: Number,
    deliveryFee: Number,
    totalAmount: Number,

    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
