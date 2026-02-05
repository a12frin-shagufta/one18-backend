// routes/paynow.js
import QRCode from "qrcode";
import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/qr/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const amount = order.totalAmount.toFixed(2);

    const paynowString =
      `paynow://pay?uen=${process.env.PAYNOW_UEN}` +
      `&amount=${amount}` +
      `&ref=ORDER_${order._id}`;

    const qr = await QRCode.toDataURL(paynowString);

    res.json({
      qr,
      amount,
      reference: `ORDER_${order._id}`,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
