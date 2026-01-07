import mongoose from "mongoose";
import slugify from "slugify";

const festivalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    bannerImage: {
      type: String,
      required: true, // IMPORTANT
    },

    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Festival", festivalSchema);
