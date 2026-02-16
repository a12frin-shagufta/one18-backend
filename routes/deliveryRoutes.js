import express from "express";
import { DEFAULT_BRANCH_LOCATION } from "../config/branchLocation.js";
import { getDistanceKm } from "../utils/distance.js";
import { validateSingaporePostal } from "../utils/validateSingaporePostal.js";


const router = express.Router();

router.post("/check", async (req, res) => {
  try {
    const { postalCode, subtotal = 0 } = req.body;

    if (!postalCode) {
      return res.status(400).json({ message: "Postal code required" });
    }

    const postal = await validateSingaporePostal(postalCode);

    if (!postal.valid) {
      return res.status(400).json({ message: "Invalid postal code" });
    }

    const area = (postal.area || "").toLowerCase();

    // ✅ REGION RULES
    let deliveryFee = 20; // default west

    if (area.includes("east") || area.includes("north")) {
      deliveryFee = 15;
    }

    // ✅ free delivery rule (optional keep)
    if (Number(subtotal) >= 180) {
      deliveryFee = 0;
    }

    res.json({
      eligible: true,
      area: postal.area,
      deliveryFee
    });

  } catch (err) {
    console.error("Delivery check error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
