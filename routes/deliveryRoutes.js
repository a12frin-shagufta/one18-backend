import express from "express";
import { DEFAULT_BRANCH_LOCATION } from "../config/branchLocation.js";
import { getDistanceKm } from "../utils/distance.js";
import { validateSingaporePostal } from "../utils/validateSingaporePostal.js";


const router = express.Router();

router.post("/check", async (req, res) => {
  try {
    const { postalCode, subtotal = 0 } = req.body;

    const postal = await validateSingaporePostal(postalCode);

    if (!postal.valid) {
      return res.status(400).json({ message: "Invalid postal code" });
    }

    const area = (postal.area || "").toLowerCase();

    let deliveryFee = 20; // default = west

    // ✅ EAST / NORTH = 15
    if (
      area.includes("east") ||
      area.includes("tampines") ||
      area.includes("pasir") ||
      area.includes("bedok") ||
      area.includes("north") ||
      area.includes("yishun") ||
      area.includes("woodlands")
    ) {
      deliveryFee = 15;
    }

    // optional free rule
    if (Number(subtotal) >= 180) {
      deliveryFee = 0;
    }

    res.json({
      eligible: true,
      area: postal.area,
      deliveryFee
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
