import express from "express";
import {
  getCategories,
  addCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", upload.single("image"), addCategory); // ✅ ONLY ONE POST
router.delete("/:id", deleteCategory);

export default router;
