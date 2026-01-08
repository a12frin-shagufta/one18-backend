

/* ======================
   ADD MENU ITEM
====================== */
import slugify from "slugify";
import MenuItem from "../models/MenuItem.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";
// controllers/menuController.js
export const addMenuItem = async (req, res) => {
  try {
  const {
  name,
  description,
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

    const imageUrls = [];

    for (const file of req.files) {
      const base64 = file.buffer.toString("base64");
      const dataUri = `data:${file.mimetype};base64,${base64}`;

      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "menu",
      });

      imageUrls.push(uploadResult.secure_url);
    }

    const slug = slugify(name, { lower: true, strict: true });

    const menuItem = await MenuItem.create({
  name: name.trim(),
  slug,
  description: description?.trim() || "",
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
      $or: [
        { isAvailable: true },
        { isAvailable: { $exists: false } },
      ],
    };

    // ✅ branch filter (existing)
    if (branch && mongoose.Types.ObjectId.isValid(branch)) {
      query.branches = branch;
    }

    // ✅ festival filter (NEW, optional)
    if (festival && mongoose.Types.ObjectId.isValid(festival)) {
      query.festival = festival;
    }

    const menu = await MenuItem.find(query)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("festival", "name slug bannerImage isActive")
      .sort({ isBestSeller: -1 });

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
  category,
  subcategory,
  variants,
  branches,        // ✅ ADD
  preorder,        // ✅ ADD
  isBestSeller,
  removedImages,
  inStock,
  isAvailable,
  festival,
} = req.body;
;

 let removed = [];
try {
  removed = removedImages ? JSON.parse(removedImages) : [];
} catch {
  removed = [];
}


    const parsedVariants =
      typeof variants === "string" ? JSON.parse(variants) : variants;

    // 🔥 1. FETCH EXISTING ITEM
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // 🔥 2. START WITH EXISTING IMAGES
    let finalImages = [...item.images];

    // 🔥 3. REMOVE DELETED IMAGES
    if (removed.length > 0) {
      finalImages = finalImages.filter(img => !removed.includes(img));
    }

    // 🔥 4. ADD NEW IMAGES
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64 = file.buffer.toString("base64");
        const dataUri = `data:${file.mimetype};base64,${base64}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder: "menu",
        });

        finalImages.push(uploadResult.secure_url);
      }
    }

    // 🔥 5. UPDATE OBJECT
const update = {
  name: name.trim(),
  slug: slugify(name, { lower: true, strict: true }),
  description: description?.trim() || "",
  category,
  subcategory,
  festival: festival && festival !== "null" ? festival : null,

  variants: parsedVariants,

  branches: branches ? JSON.parse(branches) : item.branches,   // ✅
  preorder: preorder ? JSON.parse(preorder) : item.preorder,   // ✅

  isBestSeller: isBestSeller === "true",
  inStock: inStock !== "false",
  isAvailable: isAvailable !== "false",
  images: finalImages,
};



    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.json({ success: true, item: updatedItem });
  } catch (err) {
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
      .populate("festival", "name"); // ✅ ADD THIS LINE

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



// controllers/menuController.js
// ADMIN: get all menu items (no branch filter)
export const getAdminMenu = async (req, res) => {
  try {
    const menu = await MenuItem.find()
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("festival", "name");

    res.json(menu); // ✅ MUST return array
  } catch (err) {
    console.error("ADMIN MENU ERROR:", err);
    res.status(500).json({ message: "Failed to load admin menu" });
  }
};
