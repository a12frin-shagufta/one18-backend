import Festival from "../models/Festival.js";
import MenuItem from "../models/MenuItem.js";
import cloudinary from "../config/cloudinary.js";
import slugify from "slugify";
/* ==========================
   CREATE FESTIVAL
========================== */


export const createFestival = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !req.file) {
      return res.status(400).json({
        message: "Festival name and banner are required",
      });
    }

    // 🔥 Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "festivals",
    });

    const festival = await Festival.create({
      name,
      slug: slugify(name, { lower: true }),
      bannerImage: uploadResult.secure_url, // ✅ VALID URL
      isActive: true,
      
      
    });

    res.json(festival);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};




/* ==========================
   GET FESTIVALS
========================== */
export const getFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find().sort({ createdAt: -1 });

    const result = await Promise.all(
      festivals.map(async (f) => {
        const count = await MenuItem.countDocuments({ festival: f._id });

        return {
          ...f.toObject(),
          productCount: count,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ==========================
   TOGGLE FESTIVAL
========================== */
export const toggleFestival = async (req, res) => {
  try {
    const festival = await Festival.findById(req.params.id);

    if (!festival) {
      return res.status(404).json({ message: "Festival not found" });
    }

    festival.isActive = !festival.isActive;
    await festival.save();

    res.json({ success: true, isActive: festival.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ==========================
   DELETE FESTIVAL
========================== */
export const deleteFestival = async (req, res) => {
  try {
    await Festival.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
