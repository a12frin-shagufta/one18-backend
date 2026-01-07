import express from "express";
import Branch from "../models/Branch.js";
import adminAuth from "../middleware/adminAuth.js";
import slugify from "slugify";

const router = express.Router();

// GET branches
router.get("/", async (req, res) => {
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
  res.json(branches);
});

// CREATE branch
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Branch name required" });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const branch = await Branch.create({
      name,
      address,
      slug, // ✅ THIS FIXES EVERYTHING
    });

    res.json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
