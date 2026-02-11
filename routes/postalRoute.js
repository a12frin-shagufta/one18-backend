import express from "express";
import { validateSingaporePostal } from "../utils/validateSingaporePostal.js";

const router = express.Router();

router.post("/validate", async (req, res) => {
  const { postalCode } = req.body;

  if (!postalCode) {
    return res.status(400).json({ valid: false });
  }

  const result = await validateSingaporePostal(postalCode);

  return res.json({
    valid: result.valid,
    area: result.area || null,
    lat: result.lat || null,
    lng: result.lng || null,
    formattedAddress: result.formattedAddress || null,
  });
});

export default router;
