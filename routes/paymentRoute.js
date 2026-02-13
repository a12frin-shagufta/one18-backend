import express from "express";
import Stripe from "stripe";
import Order from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";
import multer from "multer";
import { uploadPaymentProof } from "../controllers/paymentProofController.js";
import { buildOrderDetailsHTML } from "../utils/emailTemplates.js";
import { exportPaymentReport } from "../controllers/paymentReportController.js";
import adminAuth from "../middleware/adminAuth.js";
import Counter from "../models/Counter.js";



const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


async function getNextOrderNumber() {
  const counter = await Counter.findOneAndUpdate(
    { name: "order" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return "#" + String(counter.seq).padStart(4, "0");
}


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
    const orderNumber = await getNextOrderNumber();
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
  {
    paymentStatus: "paid",
    paymentMethod: "stripe",
    transactionId: session.payment_intent || session.id,
    creditedAccount: "Stripe",
    paidAmount: session.amount_total / 100,
    paidAt: new Date(),
  },
  { new: true }
);
;

    log("Order found + updated:", !!order);
    log("Order customer email:", order?.customer?.email);

    // ✅ Send response immediately (avoid 504 timeout)
    res.json({
      success: true,
      message: "Payment verified ✅ (email sending in background)",
    });

    // ✅ EMAIL (BACKGROUND - NO AWAIT)
  // ✅ EMAIL (BACKGROUND - NO AWAIT)
if (order?.customer?.email) {
  log("Preparing customer email (background)...");

  sendEmail({
    to: order.customer.email,
    subject: `Order Confirmed ✅ | ONE18 Bakery`,
    html: buildOrderDetailsHTML(order),
  })
    .then((emailRes) => {
      log("✅ Customer Email SENT successfully!");
      log("Customer email messageId:", emailRes?.messageId || "N/A");
    })
    .catch((emailErr) => {
      errlog("❌ Customer Email FAILED:", emailErr.message);
    });

} else {
  log("⚠️ No customer email found — skipping customer email");
}


// ✅ ADMIN EMAIL ALERT (BACKGROUND)
const ADMIN_EMAIL =
  process.env.ADMIN_ORDER_EMAIL || process.env.MAIL_FROM_EMAIL;

if (ADMIN_EMAIL) {
  log("Preparing admin order alert email (background)...");

  sendEmail({
  to: ADMIN_EMAIL,
  subject: `🚨 New Order Received | ONE18 Bakery`,
  html: buildOrderDetailsHTML(order),
})
  .then(() => log("✅ Admin Email SENT"))
  .catch((e) => errlog("❌ Admin Email FAILED:", e.message));

} else {
  log("⚠️ ADMIN_ORDER_EMAIL missing — skipping admin alert email");
}

  } catch (err) {
    errlog("verify ERROR:", err.message);
    errlog(err);

    return res.status(500).json({
      message: err.message || "Payment verification failed",
    });
  }
});


const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});


router.post(
  "/upload-proof",
  upload.single("proof"),
  uploadPaymentProof
);


/* ==============================
   ADMIN ACCEPT PAYNOW PAYMENT
================================ */
router.put("/paynow/:id/accept", async (req, res) => {
  try {
    const existing = await Order.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: "paid",
        paymentMethod: "paynow",
        creditedAccount: "PayNow",
        paidAmount: existing.totalAmount,
        paidAt: new Date(),
      },
      { new: true }
    );

    if (order.customer?.email) {
      sendEmail({
        to: order.customer.email,
        subject: "Payment Confirmed ✅ | ONE18 Bakery",
        html: buildOrderDetailsHTML(order),
      });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ==============================
   ADMIN REJECT PAYNOW PAYMENT
================================ */
router.put("/paynow/:id/reject", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "rejected" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // EMAIL CUSTOMER
    if (order.customer?.email) {
     sendEmail({
  to: order.customer.email,
  subject: "Payment Rejected ❌ | ONE18 Bakery",
  html: buildOrderDetailsHTML(order),
});

    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/payment-report", adminAuth, exportPaymentReport);


export default router;
