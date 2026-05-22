import express from "express";
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  bookLalamove,
  markOrderPaidByCustomer,
  getLalamoveQuote,
  markOrderPrinted,
  deleteOrder,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";


const router = express.Router(); 

router.post("/", createOrder); // customer
router.get("/", adminAuth, getAllOrders); // admin
router.put("/:id/lalamove/request", adminAuth, bookLalamove);

router.put("/:id/status", adminAuth, updateOrderStatus);
router.put("/:id/mark-paid", markOrderPaidByCustomer);
router.put("/:id/printed", adminAuth, markOrderPrinted);
router.delete("/:id", adminAuth, deleteOrder);
// router.post("/lalamove-quote", getLalamoveQuote);



export default router;
