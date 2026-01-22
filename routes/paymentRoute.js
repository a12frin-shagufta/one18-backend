import express from "express";
import Stripe from "stripe";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, deliveryFee, orderPayload } = req.body;

    // ✅ Convert cart items into Stripe line items
    const line_items = items.map((item) => ({
      price_data: {
        currency: "sgd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // ✅ cents
      },
      quantity: item.qty,
    }));

    // ✅ If delivery fee exists, add as another item
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`,
      metadata: {
        orderPayload: JSON.stringify(orderPayload), // ✅ we store order data safely
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
