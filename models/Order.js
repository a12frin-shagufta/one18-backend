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

    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true }, // ✅ ADD THIS
      company: { type: String },
      phone: { type: String, required: true },

      address: {
        type: String,
        required: function () {
          return this.parent().fulfillmentType === "delivery";
        },
      },

      apartment: { type: String },

      postalCode: {
        type: String,
        required: function () {
          return this.parent().fulfillmentType === "delivery";
        },
      },

      message: { type: String },
    },
paymentMethod: {
  type: String,
  enum: ["paynow", "stripe"],
  required: true,
},

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    fulfillmentDate: { type: String, required: true },
    fulfillmentTime: { type: String, required: true },

   deliveryAddress: {
  addressText: { type: String },
  postalCode: { type: String },
  area: { type: String }, // ✅ NEW
},


    pickupLocation: {
      name: { type: String },
      address: { type: String },
    },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
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
