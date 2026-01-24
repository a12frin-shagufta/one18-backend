import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    // percent or flat
    type: {
      type: String,
      enum: ["percent", "flat"],
      required: true,
    },

    value: { type: Number, required: true },

    // ✅ NEW appliesTo options
    appliesTo: {
      type: String,
      enum: ["all", "selected", "category", "festival"],
      default: "all",
    },

    // ✅ for selected products
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }],

    // ✅ NEW: category offers
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    // ✅ NEW: festival offers
    festivals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Festival" }],

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);
