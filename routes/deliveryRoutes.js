import express from "express";
const router = express.Router();

// FAR AREA PREFIXES
const FAR_PREFIXES = [
  "46","47","48","49","50","51","52","53","54","55","56","57",
  "60","61","62","63","64","65","66","67","68","69",
  "70","71","72","73","74","75","76","77","78","79"
];

// ✅ Validate Singapore postal code
function isValidSingaporePostal(postalCode) {
  if (!/^\d{6}$/.test(postalCode)) return false;

  const prefix = Number(postalCode.slice(0, 2));
  return prefix >= 1 && prefix <= 82;
}

// ✅ Delivery fee calculator (PURE FUNCTION)
function calculateDeliveryFee({ postalCode, subtotal }) {
  if (!isValidSingaporePostal(postalCode)) {
    throw new Error("INVALID_POSTAL");
  }

  // Free delivery rule
  if (Number(subtotal || 0) >= 180) return 0;

  const prefix = postalCode.slice(0, 2);
  return FAR_PREFIXES.includes(prefix) ? 15 : 10;
}

// ✅ API
router.post("/check", (req, res) => {
  try {
    const { postalCode, subtotal = 0 } = req.body;

    if (!postalCode) {
      return res.status(400).json({ message: "Postal code required" });
    }

    const deliveryFee = calculateDeliveryFee({ postalCode, subtotal });

    return res.json({
      eligible: true,
      deliveryFee,
    });
  } catch (err) {
    if (err.message === "INVALID_POSTAL") {
      return res.status(400).json({
        message: "Postal code not supported in Singapore",
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
