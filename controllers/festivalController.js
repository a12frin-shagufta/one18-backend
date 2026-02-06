import Festival from "../models/Festival.js";
import MenuItem from "../models/MenuItem.js";
import slugify from "slugify";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { r2 } from "../config/r2.js";
import { sendNewsletterToAll } from "../utils/newsletterMailer.js";


export const createFestival = async (req, res) => {
  // 🔔 Notify subscribers (async — don't block response)


  try {
    const { name } = req.body;

    if (!name || !req.file) {
      return res.status(400).json({
        message: "Festival name and banner are required",
      });
    }

    const ext = req.file.originalname.split(".").pop();
    const fileName = `festivals/${crypto.randomBytes(16).toString("hex")}.${ext}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const bannerUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    const festival = await Festival.create({
      name,
      slug: slugify(name, { lower: true }),
      bannerImage: bannerUrl,
      isActive: true,
    });

    sendNewsletterToAll({
      
  subject: `🎉 New Festival Menu: ${festival.name}`,
  html: `
    <h2>New Festival Collection Live!</h2>
    <p>We just launched <b>${festival.name}</b> specials.</p>
    <p>Check it out now on our website 🍰</p>
  `
});

    res.json(festival);
  } catch (err) {
    console.error("CREATE FESTIVAL ERROR:", err);
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
