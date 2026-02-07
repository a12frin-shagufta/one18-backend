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

    const km = getDistanceKm(
      DEFAULT_BRANCH_LOCATION.lat,
      DEFAULT_BRANCH_LOCATION.lng,
      postal.lat,
      postal.lng
    );

    let deliveryFee = km > 10 ? 15 : 10;

    if (Number(subtotal) >= 180) deliveryFee = 0;

    return res.json({
      eligible: true,
      distanceKm: Number(km.toFixed(2)),
      deliveryFee
    });

  } catch (err) {
    console.error("Delivery check error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
