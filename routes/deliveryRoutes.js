import express from "express";
import { validateSingaporePostal } from "../utils/validateSingaporePostal.js";

const router = express.Router();

/* ==========================================================================
   DELIVERY PRICING  (client spec, 10 Aug 2026)
   --------------------------------------------------------------------------
     • Minimum order for delivery: $30
     • $30.00 – $59.99  ->  $6.99
     • $60.00 and above ->  free
     • Self-pickup: no minimum, no fee (this route isn't called for pickup)

   Flat island-wide pricing replaced the old prefix-based $15 / $20 zones and
   the old $180 free-delivery threshold.

   These figures live in ONE place on purpose. The fee is re-checked when the
   order is created, and both paths read from here — that's what stops the
   cart and the charge drifting apart.
   ========================================================================== */
export const DELIVERY_RULES = {
  minimumOrder: 30,
  standardFee: 6.99,
  freeDeliveryFrom: 60,
};

/**
 * Single source of truth for what delivery costs.
 * @param {number} subtotal - items subtotal, BEFORE any delivery fee
 * @returns {{ eligible: boolean, deliveryFee: number, reason?: string }}
 */
export const calculateDeliveryFee = (subtotal) => {
  const value = Number(subtotal) || 0;

  if (value < DELIVERY_RULES.minimumOrder) {
    return {
      eligible: false,
      deliveryFee: 0,
      reason: `Minimum order for delivery is $${DELIVERY_RULES.minimumOrder}. Add $${(
        DELIVERY_RULES.minimumOrder - value
      ).toFixed(2)} more, or choose self-pickup instead.`,
    };
  }

  if (value >= DELIVERY_RULES.freeDeliveryFrom) {
    return { eligible: true, deliveryFee: 0 };
  }

  return { eligible: true, deliveryFee: DELIVERY_RULES.standardFee };
};

router.post("/check", async (req, res) => {
  try {
    const { postalCode, subtotal = 0 } = req.body;

    // 1. Format check first — cheap, and avoids a pointless Google lookup
    if (!/^\d{6}$/.test(postalCode)) {
      return res.status(400).json({ message: "Invalid postal code" });
    }

    // 2. Confirm it's a real Singapore address
    const postal = await validateSingaporePostal(postalCode);
    if (!postal.valid) {
      return res.status(400).json({ message: "Invalid postal code" });
    }

    // 3. Apply the pricing rules
    const result = calculateDeliveryFee(subtotal);

    if (!result.eligible) {
      return res.status(400).json({
        message: result.reason,
        minimumOrder: DELIVERY_RULES.minimumOrder,
        subtotal: Number(subtotal) || 0,
      });
    }

    res.json({
      eligible: true,
      area: postal.area,
      deliveryFee: result.deliveryFee,
      // lets the storefront show "spend $X more for free delivery"
      freeDeliveryFrom: DELIVERY_RULES.freeDeliveryFrom,
    });
  } catch (err) {
    console.error("DELIVERY CHECK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;