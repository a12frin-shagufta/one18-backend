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

    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String }, // optional
      message: { type: String }, // optional instructions
    },

    deliveryAddress: {
      address: { type: String },
      postalCode: { type: String },
      distanceKm: { type: Number },
    },

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
