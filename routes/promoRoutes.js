// routes/promoRoutes.js
import express from "express";
import { getPromoItems, togglePromoEligible } from "../controllers/promoController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/items", getPromoItems);                          // public
router.patch("/toggle/:id", adminAuth, togglePromoEligible);   // admin only

export default router;