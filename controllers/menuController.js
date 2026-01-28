/* ======================
   ADD MENU ITEM
====================== */
import slugify from "slugify";
import MenuItem from "../models/MenuItem.js";
import mongoose from "mongoose";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { r2 } from "../config/r2.js";
import sharp from "sharp";




// ✅ helper upload function
const uploadFileToR2 = async (file) => {
  // ✅ compress image before upload
  const compressedBuffer = await sharp(file.buffer)
    .resize(1400) // max width
    .jpeg({ quality: 70 }) // reduce size
    .toBuffer();

  const fileName = `menu/${crypto.randomBytes(16).toString("hex")}.jpg`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: compressedBuffer,
      ContentType: "image/jpeg",
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
};


export const addMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      servingInfo,
      category,
      subcategory,
      variants,
      branches,
      preorder,
      isBestSeller,
      festival,
      inStock,
    } = req.body;

    if (!name || !category || !variants) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const parsedVariants =
      typeof variants === "string" ? JSON.parse(variants) : variants;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image required" });
    }

    // ✅ Upload all images to R2
    const imageUrls = [];
    for (const file of req.files) {
      const url = await uploadFileToR2(file);
      imageUrls.push(url);
    }

    const slug = slugify(name, { lower: true, strict: true });

    const menuItem = await MenuItem.create({
      name: name.trim(),
      slug,
      description: description?.trim() || "",
      servingInfo: servingInfo?.trim() || "",
      category,
      subcategory: subcategory || null,
      images: imageUrls,
      variants: parsedVariants,
      branches: branches ? JSON.parse(branches) : [],
      preorder: preorder ? JSON.parse(preorder) : { enabled: false },
      festival: festival || null,
      isBestSeller: isBestSeller === "true" || isBestSeller === true,
      inStock: inStock !== "false",
    });

    res.json({ success: true, menuItem });
  } catch (err) {
    console.error("ADD MENU ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   GET MENU
====================== */
export const getMenu = async (req, res) => {
  try {
    const { branch, festival } = req.query;

    const query = {
      inStock: true,
      $or: [{ isAvailable: true }, { isAvailable: { $exists: false } }],
    };

    // ✅ Festival should behave like Best Seller (NO branch dependency)
if (festival && mongoose.Types.ObjectId.isValid(festival)) {
  query.festival = festival;
} 
// ✅ Branch filter ONLY when NOT festival
else if (branch && mongoose.Types.ObjectId.isValid(branch)) {
  query.branches = branch;
}


    const menu = await MenuItem.find(query)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("festival", "name slug bannerImage isActive")
     .sort({ isBestSeller: -1, createdAt: -1 });


    res.json(menu);
  } catch (err) {
    console.error("GET MENU ERROR:", err);
    res.status(500).json({ message: "Failed to load menu" });
  }
};

/* ======================
   UPDATE MENU ITEM
====================== */
export const updateMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      servingInfo,
      category,
      subcategory,
      variants,
      branches,
      preorder,
      isBestSeller,
      removedImages,
      inStock,
      isAvailable,
      festival,
    } = req.body;

    let removed = [];
    try {
      removed = removedImages ? JSON.parse(removedImages) : [];
    } catch {
      removed = [];
    }

    const parsedVariants =
      typeof variants === "string" ? JSON.parse(variants) : variants;

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    let finalImages = [...item.images];

    // ✅ Remove deleted images from DB list
    if (removed.length > 0) {
      finalImages = finalImages.filter((img) => !removed.includes(img));
    }

    // ✅ Upload new images to R2
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadFileToR2(file);
        finalImages.push(url);
      }
    }

    const update = {
      name: name.trim(),
      slug: slugify(name, { lower: true, strict: true }),
      description: description?.trim() || "",
      servingInfo: servingInfo?.trim() || "",
      category,
      subcategory,
      festival: festival && festival !== "null" ? festival : null,
      variants: parsedVariants,
      branches: branches ? JSON.parse(branches) : item.branches,
      preorder: preorder ? JSON.parse(preorder) : item.preorder,
      isBestSeller: isBestSeller === "true",
      inStock: inStock !== "false",
      isAvailable: isAvailable !== "false",
      images: finalImages,
    };

    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    res.json({ success: true, item: updatedItem });
  } catch (err) {
    console.error("UPDATE MENU ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   DELETE MENU ITEM
====================== */
export const deleteMenuItem = async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   GET MENU ITEM BY ID
====================== */
export const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("festival", "name");

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMenuItemBySlug = async (req, res) => {
  try {
    const item = await MenuItem.findOne({ slug: req.params.slug })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("festival", "name slug bannerImage isActive");

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   ADMIN MENU
====================== */
export const getAdminMenu = async (req, res) => {
  try {
    const menu = await MenuItem.find()
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("festival", "name")
      .sort({ createdAt: -1 });

    res.json(menu);
  } catch (err) {
    console.error("ADMIN MENU ERROR:", err);
    res.status(500).json({ message: "Failed to load admin menu" });
  }
};
