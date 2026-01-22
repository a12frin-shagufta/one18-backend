import express from "express";
import Stripe from "stripe";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";

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

    if (!orderId) {
      return res.status(400).json({ message: "Order ID missing in session" });
    }

    // ✅ Update payment status
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: "paid" },
      { new: true }
    );

    // ✅ Send email (only if customer email exists)
    if (order?.customer?.email) {
      await sendEmail({
        to: order.customer.email,
        subject: `Order Confirmed ✅ | ONE18 Bakery`,
        html: `
          <div style="font-family: Arial; line-height: 1.6;">
            <h2>Thank you for your order, ${order.customer.firstName} 🎉</h2>
            <p>Your payment was successful and your order is confirmed ✅</p>

            <h3>Order Summary</h3>
            <p><b>Order ID:</b> ${order._id}</p>
            <p><b>Fulfillment:</b> ${order.fulfillmentType}</p>
            <p><b>Date:</b> ${order.fulfillmentDate}</p>
            <p><b>Time:</b> ${order.fulfillmentTime}</p>

            <h3>Items:</h3>
            <ul>
              ${order.items
                .map(
                  (i) =>
                    `<li>${i.name} ${i.variant ? `(${i.variant})` : ""} × ${
                      i.qty
                    }</li>`
                )
                .join("")}
            </ul>

            <p><b>Total Paid:</b> SGD ${order.totalAmount}</p>

            <p style="margin-top:20px;">We’ll start preparing your order soon 💛</p>
            <p><b>ONE18 Bakery</b></p>
          </div>
        `,
      });
    }

    return res.json({ success: true, message: "Payment verified ✅ Email sent ✅" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});



export default router;
