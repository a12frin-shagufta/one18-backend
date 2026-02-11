import express from "express";
import {
  subscribeNewsletter,
  getNewsletterSubscribers,
  sendManualNewsletter
} from "../controllers/newsletterController.js";

import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/subscribe", subscribeNewsletter);

// ✅ ADMIN ONLY
router.get("/list", adminAuth, getNewsletterSubscribers);

// ✅ NEW — manual newsletter send
router.post("/admin/send", adminAuth, sendManualNewsletter);

export default router;
