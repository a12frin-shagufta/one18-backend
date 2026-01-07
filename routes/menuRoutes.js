import express from "express";
import upload from "../middleware/upload.js";
import {
  addMenuItem,
  getMenu,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemBySlug,
  getAdminMenu
} from "../controllers/menuController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();


/* CREATE */
router.post("/", adminAuth, upload.array("images", 5), addMenuItem);


/* READ */
router.get("/admin", adminAuth, getAdminMenu);
router.get("/", getMenu);
router.get("/slug/:slug", getMenuItemBySlug);
router.get("/:id", getMenuItemById);   // ✅ MUST BE BEFORE put/delete

/* UPDATE */
router.put("/:id", adminAuth,upload.array("images", 5), updateMenuItem);


/* DELETE */
router.delete("/:id", adminAuth, deleteMenuItem);

// routes/menuRoutes.js



export default router;
