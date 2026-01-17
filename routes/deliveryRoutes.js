import express from "express";

const router = express.Router();

// ✅ Far area prefixes (example)
const FAR_PREFIXES = [
  "46","47","48","49","50","51","52","53","54","55","56","57",
  "60","61","62","63","64","65","66","67","68","69",
  "70","71","72","73","74","75","76","77","78","79"
];

function calculateDeliveryFee({ postalCode, subtotal }) {
  if (!postalCode) return null;

  const cleanPostal = String(postalCode).trim();

  // ✅ Must be 6 digit SG postal code
 if (!/^\d{6}$/.test(cleanPostal)) {
  return res.status(400).json({ message: "Invalid Singapore postal code" });
}

  // ✅ Free delivery rule
  if (Number(subtotal || 0) >= 180) return 0;

  const prefix = cleanPostal.slice(0, 2);
  return FAR_PREFIXES.includes(prefix) ? 15 : 10;
}

router.post("/check", (req, res) => {
  const { postalCode, subtotal } = req.body;

  if (!postalCode) {
    return res.status(400).json({ message: "Postal code required" });
  }

  const fee = calculateDeliveryFee({ postalCode, subtotal });

  if (fee === null) {
    return res.status(400).json({ message: "Invalid Singapore postal code" });
  }

  return res.json({
    eligible: true,
    deliveryFee: fee,
  });
});

export default router;
