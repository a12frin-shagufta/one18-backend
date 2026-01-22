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
      address: {
  type: String,
  required: function () {
    return this.fulfillmentType === "delivery";
  },
},
      apartment: { type: String },
     postalCode: {
  type: String,
  required: function () {
    return this.fulfillmentType === "delivery";
  },
},

      // ✅ instructions from cart drawer
      message: { type: String },
    },

    paymentStatus: {
  type: String,
  enum: ["pending", "paid", "failed"],
  default: "pending",
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
    lalamoveStatus: {
  type: String,
  enum: ["not_required", "not_booked", "booking_requested", "booked", "failed"],
  default: "not_booked",
},

lalamoveBookingId: { type: String, default: null },
lalamoveTrackingLink: { type: String, default: null },

  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
