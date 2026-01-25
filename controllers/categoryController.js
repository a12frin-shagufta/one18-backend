import Category from "../models/Category.js";
import sharp from "sharp";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { r2 } from "../config/r2.js";

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
        .resize(1200)
        .jpeg({ quality: 70 })
        .toBuffer();

      const fileName = `categories/${crypto.randomBytes(16).toString("hex")}.jpg`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: compressedBuffer,
          ContentType: "image/jpeg",
        })
      );

      coverImage = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    }

    const category = await Category.create({
      name: name.toLowerCase(),
      coverImage,
    });

    res.json(category);
  } catch (err) {
    console.error("ADD CATEGORY ERROR:", err);
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
