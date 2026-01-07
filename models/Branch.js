// models/Branch.js
import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // 👈 important
  address: String,
  phone: String,
  image: String,
  location: {
    lat: Number,
    lng: Number,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Branch", branchSchema);
