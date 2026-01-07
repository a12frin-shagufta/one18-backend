import express from "express";
import upload from "../middleware/upload.js";

import {
  createFestival,
  getFestivals,
  deleteFestival,
  toggleFestival,
} from "../controllers/festivalController.js";

const router = express.Router();

router.post("/", upload.single("banner"), createFestival);
router.get("/", getFestivals);
router.delete("/:id", deleteFestival);
router.patch("/toggle/:id", toggleFestival);

export default router;
