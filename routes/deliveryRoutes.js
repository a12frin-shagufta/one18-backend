import express from "express";
import { DEFAULT_BRANCH_LOCATION } from "../config/branchLocation.js";
import { getDistanceKm } from "../utils/distance.js";
import { validateSingaporePostal } from "../utils/validateSingaporePostal.js";


const router = express.Router();

// Define the prefixes for $15 regions (East & North)
const LOW_FEE_PREFIXES = [
  // EAST (46-57)
  "46","47","48","49","50","51","52","53","54","55","56","57",
  // NORTH (72-79)
  "72","73","74","75","76","77","78","79"
];

router.post("/check", async (req, res) => {
  try {
    const { postalCode, subtotal = 0 } = req.body;

    // ✅ 1. Basic format check FIRST
    if (!/^\d{6}$/.test(postalCode)) {
      return res.status(400).json({ message: "Invalid postal code" });
    }

    // ✅ 2. Validate via Google
    const postal = await validateSingaporePostal(postalCode);

    if (!postal.valid) {
      return res.status(400).json({ message: "Invalid postal code" });
    }

    // ✅ 3. Free delivery rule (highest priority)
    if (Number(subtotal) >= 180) {
      return res.json({
        eligible: true,
        area: postal.area,
        deliveryFee: 0
      });
    }

    // ✅ 4. Prefix-based pricing
    const prefix = postalCode.substring(0, 2);

    const LOW_FEE_PREFIXES = [
      "46","47","48","49","50","51","52","53","54","55","56","57",
      "72","73","74","75","76","77","78","79"
    ];

    const deliveryFee = LOW_FEE_PREFIXES.includes(prefix)
      ? 15
      : 20;

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
