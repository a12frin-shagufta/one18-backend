import express from "express";
import Stripe from "stripe";
import Order from "../models/Order.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, deliveryFee, orderPayload } = req.body;

    // ✅ 1) Save order in DB first (pending payment)
    const savedOrder = await Order.create({
      ...orderPayload,
      status: "pending",
      paymentStatus: "pending", // add this field in schema (recommended)
    });

    // ✅ Convert cart items into Stripe line items
    const line_items = items.map((item) => ({
      price_data: {
        currency: "sgd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

    if (deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: "sgd",
          product_data: { name: "Delivery Fee" },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    // ✅ 2) Create Stripe session with only orderId
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,

      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`,

      metadata: {
        orderId: savedOrder._id.toString(), // ✅ very small ✅
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
router.post("/verify", async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
      });
    }

    return res.json({ success: true, message: "Payment verified ✅" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});



export default router;
