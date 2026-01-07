



// ADD category
import Category from "../models/Category.js";
import cloudinary from "../config/cloudinary.js";
import sharp from "sharp";

// ADD category
export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const exists = await Category.findOne({ name: name.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    let coverImage = "";

    // ✅ IMAGE UPLOAD (OPTIONAL + COMPRESSED)
    if (req.file) {
      // 🔥 COMPRESS IMAGE
      const compressedBuffer = await sharp(req.file.buffer)
        .resize(1200) // max width
        .jpeg({ quality: 70 }) // reduce size
        .toBuffer();

      // 🔥 UPLOAD TO CLOUDINARY
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "categories", resource_type: "image" },
            (err, result) => {
              if (err) reject(err);
              resolve(result);
            }
          )
          .end(compressedBuffer);
      });

      coverImage = uploadResult.secure_url;
    }

    const category = await Category.create({
      name: name.toLowerCase(),
      coverImage,
    });

    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// DELETE category
export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};