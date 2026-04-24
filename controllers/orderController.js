import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import moment from "moment-timezone";
import Branch from "../models/Branch.js";
import { validateSingaporePostal } from "../utils/validateSingaporePostal.js";
import { sendEmail } from "../utils/sendEmail.js";


import { buildOrderDetailsHTML } from "../utils/emailTemplates.js";

import Counter from "../models/Counter.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);




async function getNextOrderNumber() {
  const counter = await Counter.findOneAndUpdate(
    { name: "order" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return "#" + String(counter.seq).padStart(4, "0");
}



const HOURS_2 = 2;
const DAYS_3 = 3;
const SG_TZ = "Asia/Singapore";

export const createOrder = async (req, res) => {
  try {
    const {
  branch,
  orderType,
  fulfillmentType,
  fulfillmentDate,
  fulfillmentTime,
  customer,
  items,
  subtotal,
  deliveryFee,
  totalAmount,
   paymentProof,
  paymentMethod, // ✅ ADD THIS
} = req.body;

console.log("Incoming branch:", branch);

console.log("\n================ NEW ORDER REQUEST ================");
    console.log("📥 RAW BODY FROM CLIENT:");
    console.log(JSON.stringify(req.body, null, 2));


if (!["paynow", "stripe"].includes(paymentMethod)) {
  return res.status(400).json({
    message: "Invalid payment method",
  });
}


    // ✅ BASIC VALIDATION
    if (!orderType || !fulfillmentType || !customer || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let branchData = null;

if (branch) {
  branchData = await Branch.findById(branch);
}



if (!branchData) {
  return res.status(400).json({ message: "Branch not found" });
}

console.log("🏬 BRANCH DOC FULL =", JSON.stringify(branchData.toObject(), null, 2));

const loc = branchData.location || {};
const coords = branchData.coordinates || {};

const lat =
  loc.lat ??
  coords.lat ??
  loc.coordinates?.lat ??
  loc.coordinates?.[1];

const lng =
  loc.lng ??
  coords.lng ??
  loc.coordinates?.lng ??
  loc.coordinates?.[0];

const bakeryPickupLocation = {
  name: branchData.name,
  address: branchData.address,
  lat: Number(lat),
  lng: Number(lng),
};

console.log("🏬 PICKUP GEO FINAL =", bakeryPickupLocation);


console.log("🏬 PICKUP GEO FINAL =", bakeryPickupLocation);

if (!bakeryPickupLocation.lat || !bakeryPickupLocation.lng) {
  return res.status(400).json({
    message: "Branch coordinates missing"
  });
}




    if (!fulfillmentDate || !fulfillmentTime) {
      return res.status(400).json({ message: "Please select date and time" });
    }

    if (!customer.firstName || !customer.lastName || !customer.phone) {
      return res.status(400).json({ message: "Customer details missing" });
    }
    // ✅ Singapore phone validation
const digitsOnly = customer.phone.replace(/\D/g, "");

let normalizedPhone = digitsOnly;

if (!normalizedPhone.startsWith("65")) {
  normalizedPhone = "65" + normalizedPhone;
}

normalizedPhone = "+" + normalizedPhone;

// must be +65 + 8 digits
if (!/^\+65\d{8}$/.test(normalizedPhone)) {
  return res.status(400).json({
    message: "Invalid Singapore phone format (must be +65XXXXXXXX)",
  });
}

// overwrite with normalized version
customer.phone = normalizedPhone;
customer.phone = normalizedPhone;

console.log("📞 NORMALIZED CUSTOMER:");
console.log(JSON.stringify(customer, null, 2));


  const lalamoveStatus =
  fulfillmentType === "pickup" ? "not_required" : "self_delivery";



    // ✅ DELIVERY needs address + postal
    // ✅ DELIVERY needs address + postal + GOOGLE validation
let validatedArea = null;
let deliveryLat = null;
let deliveryLng = null;

if (fulfillmentType === "delivery") {
  if (!customer.address || !customer.postalCode) {
    return res.status(400).json({
      message: "Address and postal code required",
    });
  }

  const postalResult = await validateSingaporePostal(customer.postalCode);
  console.log("📍 POSTAL RESULT =", postalResult);

  if (!postalResult.valid) {
    return res.status(400).json({
      message: "Invalid Singapore postal code",
    });
  }
  console.log("📍 DELIVERY GEO DATA:");
console.log(JSON.stringify({
  validatedArea,
  deliveryLat,
  deliveryLng
}, null, 2));


  validatedArea = postalResult.area;
  deliveryLat = postalResult.lat;
  deliveryLng = postalResult.lng;
}



    // ✅ NOW IN SINGAPORE TIME
    const nowSG = moment().tz(SG_TZ);


    // ✅ Selected datetime in SINGAPORE time
    const selectedDateTimeSG = moment
      .tz(`${fulfillmentDate} ${fulfillmentTime}`, "YYYY-MM-DD HH:mm", SG_TZ);

    if (!selectedDateTimeSG.isValid()) {
      return res.status(400).json({ message: "Invalid date/time format" });
    }

    // ✅ RULE 1: WALK_IN = same-day order must be at least 2 hours later
   if (orderType === "WALK_IN") {
  const minAllowedTime = nowSG.clone().add(HOURS_2, "hours");
  if (selectedDateTimeSG.isBefore(minAllowedTime)) {
    return res.status(400).json({
      message: "Same-day orders require at least 2 hours preparation",
    });
  }
}


    // ✅ RULE 2: PREORDER = minimum 3 days ahead (based on date only)
    if (orderType === "PREORDER") {
      const selectedDateOnly = moment.tz(fulfillmentDate, "YYYY-MM-DD", SG_TZ).startOf("day");
      const minAllowedDate = nowSG.clone().add(DAYS_3, "days").startOf("day");

      if (selectedDateOnly.isBefore(minAllowedDate)) {
        return res.status(400).json({
          message: "Pre-orders require minimum 3 working days",
        });
      }
    }

    // ✅ VALIDATE ITEMS FROM DB
    for (const orderItem of items) {
      const menuItem = await MenuItem.findById(orderItem.productId);

      if (!menuItem) {
        return res.status(400).json({ message: "Invalid product in order" });
      }

      // ❌ preorder product ordered as WALK_IN
      if (menuItem.preorder?.enabled && orderType === "WALK_IN") {
        return res.status(400).json({
          message: `${menuItem.name} is a pre-order item and cannot be ordered as same-day`,
        });
      }

      // ❌ same-day product ordered as PREORDER
      if (!menuItem.preorder?.enabled && orderType === "PREORDER") {
        return res.status(400).json({
          message: `${menuItem.name} is a same-day item and cannot be pre-ordered`,
        });
      }
    }

    // ✅ CREATE ORDER
    console.log("📦 SAVING DELIVERY =", {
  validatedArea,
  deliveryLat,
  deliveryLng
});
// console.log("📦 FINAL ORDER PAYLOAD:");
// console.log(JSON.stringify(orderPayloadForSave, null, 2));
const orderNumber = await getNextOrderNumber();

// ✅ Normalize items (include cakeMessage safely)
const normalizedItems = items.map((item) => ({
  productId: item.productId,
  name: item.name,
  variant: item.variant,
  price: item.price,
  qty: item.qty,

  // ✅ ADD THIS
  cakeMessage: item.cakeMessage || "",

  addOns: item.addOns || [],
}));

   const order = await Order.create({
branch: branchData?._id || null,
orderNumber,
  orderType,
  fulfillmentType,
  fulfillmentDate,
  fulfillmentTime,
  customer,

  paymentMethod,
  paymentStatus: "pending",

   paymentProof: paymentMethod === "paynow" ? paymentProof || null : null, // ✅ ADD

  pickupLocation: bakeryPickupLocation,

  deliveryAddress:
    fulfillmentType === "delivery"
      ? {
          addressText: customer.address,
  postalCode: customer.postalCode,
  area: validatedArea,
  lat: deliveryLat,
  lng: deliveryLng,
        }
      : null,
       items: normalizedItems,


  subtotal,
  deliveryFee,
  totalAmount,
  lalamoveStatus,
});

console.log("✅ SAVED ORDER DOCUMENT:");
console.log(JSON.stringify(order.toObject(), null, 2));
console.log("==================================================\n");



if (paymentMethod === "paynow") {
  const ADMIN_EMAIL =
    process.env.ADMIN_ORDER_EMAIL || process.env.MAIL_FROM_EMAIL;

  // ✅ ADMIN — full order details
  if (ADMIN_EMAIL) {
    sendEmail({
      to: ADMIN_EMAIL,
      subject: "🚨 New PayNow Order — Verification Needed",
      html: buildOrderDetailsHTML(order),
    }).catch(console.error);
  }

  // ✅ CUSTOMER — full order details
  if (customer.email) {
    sendEmail({
      to: customer.email,
      subject: "Order Received ✅ — Payment Verification Pending",
      html: buildOrderDetailsHTML(order),
    }).catch(console.error);
  }
}


    return res.status(201).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }


  
};


async function autoVerifyStripeOrder(order) {
  try {
    if (
      order.paymentStatus === "pending" &&
      order.paymentMethod === "stripe" &&
      order.stripeSessionId
    ) {
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId
      );

      if (session.payment_status === "paid") {
        order.paymentStatus = "paid";
        order.transactionId = session.payment_intent || session.id;
        order.creditedAccount = "Stripe";
        order.paidAmount = session.amount_total / 100;
        order.paidAt = new Date();

        await order.save();

        console.log("✅ AUTO VERIFIED ORDER:", order._id.toString());
      }
    }
  } catch (err) {
    console.log("⚠️ Auto verify failed:", err.message);
  }
}


export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
  .sort({ createdAt: -1 })
  .populate("items.productId", "name")
  .populate("branch", "name address");
for (const order of orders) {
  await autoVerifyStripeOrder(order);
}

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// export const bookLalamove = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     if (order.paymentMethod === "paynow" && order.paymentStatus !== "paid") {
//       return res.status(400).json({
//         message: "Payment not verified yet — cannot book Lalamove",
//       });
//     }

//     if (order.fulfillmentType !== "delivery") {
//       return res.status(400).json({ message: "Not a delivery order" });
//     }

//     if (order.lalamoveStatus === "booked") {
//       return res.status(400).json({ message: "Already booked" });
//     }

//     if (!order.pickupLocation || !order.deliveryAddress) {
//       return res.status(400).json({
//         message: "Missing pickup or delivery address",
//       });
//     }

//     order.lalamoveStatus = "booking_requested";
//     await order.save();

//     // ✅ THIS IS THE ONLY CALL YOU NEED
//     const result = await createLalamoveOrder(order);

//     order.lalamoveBookingId = result.data.orderId;
//     order.lalamoveTrackingLink = result.data.shareLink;
//     order.lalamoveStatus = "booked";

//     await order.save();

//     return res.json({ success: true, result });

//   } catch (err) {
//     console.error("Lalamove booking error:");
//     console.error(err.response?.data || err.message || err);

//     await Order.findByIdAndUpdate(req.params.id, {
//       lalamoveStatus: "failed",
//     });

//     return res.status(500).json({
//       message: err.response?.data || err.message || "Lalamove booking failed",
//     });
//   }
// };

export const bookLalamove = async (req, res) => {
  return res.status(410).json({
    message: "Lalamove disabled — using in-house delivery",
  });
};



export const markOrderPaidByCustomer = async (req,res) => {
  const { paymentProof } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      paymentStatus: "pending_verification",
      paymentProof
    },
    { new: true }
  );

  res.json({ success:true, order });
};


export const getLalamoveQuote = async (req, res) => {
  try {
    const { pickup, drop } = req.body;

    if (!pickup?.lat || !drop?.lat) {
      return res.status(400).json({ message: "Coordinates required" });
    }

    const q = await getLalamoveQuotation(pickup, drop);

    res.json({
      price: q.priceBreakdown.total,
      quotationId: q.quotationId,
    });

  } catch (err) {
    console.log("QUOTE ERROR", err.response?.data || err.message);
    res.status(500).json({ message: "Quote failed" });
  }
};
