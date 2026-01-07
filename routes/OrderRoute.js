import express from "express";
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/", createOrder); // customer
router.get("/", adminAuth, getAllOrders); // admin
router.put("/:id/status", adminAuth, updateOrderStatus);

export default router;
