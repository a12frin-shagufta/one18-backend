
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    coverImage: {
      type: String, // optional category cover
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
