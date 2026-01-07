import express from "express";
import {
  createOffer,
  getOffers,
  deleteOffer,
  toggleOffer,
} from "../controllers/offerController.js";

const router = express.Router();

router.post("/", createOffer);
router.get("/", getOffers);
router.delete("/:id", deleteOffer);
router.patch("/toggle/:id", toggleOffer);

export default router;
