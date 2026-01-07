import express from "express";
import {
  getSubcategories,
  addSubcategory,
  deleteSubcategory,
} from "../controllers/subcategoryController.js";

const router = express.Router();

router.get("/", getSubcategories);
router.post("/", addSubcategory);
router.delete("/:id", deleteSubcategory);

export default router;
