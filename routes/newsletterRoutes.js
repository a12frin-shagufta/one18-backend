import express from "express";
import {
  subscribeNewsletter,
  getNewsletterSubscribers
} from "../controllers/newsletterController.js";

import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/subscribe", subscribeNewsletter);

// ✅ ADMIN ONLY
router.get("/list", adminAuth, getNewsletterSubscribers);

export default router;
