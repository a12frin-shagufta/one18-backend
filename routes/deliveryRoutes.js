import express from "express";
import { calculateDeliveryFee } from "../utils/delivery.js";

const router = express.Router();

router.post("/check", (req, res) => {
  const { postalCode, subtotal } = req.body;

  if (!postalCode || !subtotal) {
    return res.status(400).json({ message: "Missing data" });
  }

  const fee = calculateDeliveryFee({ postalCode, subtotal });

  res.json({
    eligible: true,
    deliveryFee: fee,
  });
});

export default router;
