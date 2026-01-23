import express from "express";
import Stripe from "stripe";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Logs
const log = (...args) => console.log("💳 [PAYMENT]", ...args);
const errlog = (...args) => console.log("❌ [PAYMENT]", ...args);

/* ==============================
   CREATE STRIPE CHECKOUT SESSION
================================ */
router.post("/create-checkout-session", async (req, res) => {
  log("✅ create-checkout-session HIT");

  try {
    const { items, deliveryFee, orderPayload } = req.body;

    log("Items length:", items?.length);
    log("Delivery Fee:", deliveryFee);
    log("Customer Email:", orderPayload?.customer?.email);
    log("Fulfillment Type:", orderPayload?.fulfillmentType);

    // ✅ 1) Save order in DB first (pending)
    log("Saving order in DB...");
    const savedOrder = await Order.create({
      ...orderPayload,
      status: "pending",
      paymentStatus: "pending",
    });

    log("✅ Order saved:", savedOrder._id.toString());

    // ✅ Convert cart items into Stripe line items
    const line_items = (items || []).map((item, idx) => {
      log(`Line item ${idx + 1}:`, item?.name, "x", item?.qty);

      return {
        price_data: {
          currency: "sgd",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      };
    });

    if (deliveryFee > 0) {
      log("Adding delivery fee line item...");
      line_items.push({
        price_data: {
          currency: "sgd",
          product_data: { name: "Delivery Fee" },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    // ✅ 2) Create Stripe session
    log("Creating Stripe session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`,
      metadata: {
        orderId: savedOrder._id.toString(),
      },
    });

    log("✅ Stripe session created:", session.id);
    log("✅ Stripe checkout url:", session.url);

    return res.json({ url: session.url });
  } catch (err) {
    errlog("create-checkout-session ERROR:", err.message);
    errlog(err);

    return res.status(500).json({
      message: err.message || "Failed to create Stripe session",
    });
  }
});

/* ==============================
   VERIFY PAYMENT + SEND EMAIL
   ✅ Email runs in background
================================ */
router.post("/verify", async (req, res) => {
  log("✅ verify HIT");

  try {
    const { sessionId } = req.body;

    log("sessionId received:", sessionId);

    if (!sessionId) {
      errlog("sessionId missing in request");
      return res.status(400).json({ message: "sessionId is required" });
    }

    log("Fetching Stripe session...");
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    log("Stripe session found:", !!session);
    log("Stripe payment_status:", session?.payment_status);
    log("Stripe metadata:", session?.metadata);

    if (!session || session.payment_status !== "paid") {
      errlog("Payment not completed");
      return res.status(400).json({ message: "Payment not completed" });
    }

    const orderId = session.metadata?.orderId;
    log("OrderId from metadata:", orderId);

    if (!orderId) {
      errlog("Order ID missing in Stripe metadata");
      return res.status(400).json({ message: "Order ID missing in session" });
    }

    log("Updating order paymentStatus => paid...");
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: "paid" },
      { new: true }
    );

    log("Order found + updated:", !!order);
    log("Order customer email:", order?.customer?.email);

    // ✅ Send response immediately (avoid 504 timeout)
    res.json({
      success: true,
      message: "Payment verified ✅ (email sending in background)",
    });

    // ✅ EMAIL (BACKGROUND - NO AWAIT)
    if (order?.customer?.email) {
      log("Preparing email (background)...");

      sendEmail({
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
      })
        .then((emailRes) => {
          log("✅ Email SENT successfully!");
          log("Email messageId:", emailRes?.messageId || "N/A");
        })
        .catch((emailErr) => {
          errlog("❌ Email FAILED:", emailErr.message);
        });
    } else {
      log("⚠️ No email found in order.customer.email — skipping email");
    }
  } catch (err) {
    errlog("verify ERROR:", err.message);
    errlog(err);

    return res.status(500).json({
      message: err.message || "Payment verification failed",
    });
  }
});

export default router;
