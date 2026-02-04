import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import moment from "moment-timezone";
import Branch from "../models/Branch.js";
import { validateSingaporePostal } from "../utils/validateSingaporePostal.js";
import { sendEmail } from "../utils/sendEmail.js";
import { createLalamoveOrder } from "../services/lalamoveService.js";


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

const bakeryPickupLocation = branchData
  ? {
      name: branchData.name,
      address: branchData.address,
    }
  : null;

    if (!fulfillmentDate || !fulfillmentTime) {
      return res.status(400).json({ message: "Please select date and time" });
    }

    if (!customer.firstName || !customer.lastName || !customer.phone) {
      return res.status(400).json({ message: "Customer details missing" });
    }

    const lalamoveStatus =
  fulfillmentType === "pickup" ? "not_required" : "not_booked";


    // ✅ DELIVERY needs address + postal
    // ✅ DELIVERY needs address + postal + GOOGLE validation
let validatedArea = null;

if (fulfillmentType === "delivery") {
  if (!customer.address || !customer.postalCode) {
    return res.status(400).json({
      message: "Address and postal code required",
    });
  }

  const postalResult = await validateSingaporePostal(customer.postalCode);

  if (!postalResult.valid) {
    return res.status(400).json({
      message: "Invalid Singapore postal code",
    });
  }

  validatedArea = postalResult.area; // e.g. "Ang Mo Kio"
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
   const order = await Order.create({
  branch: branch || null,
  orderType,
  fulfillmentType,
  fulfillmentDate,
  fulfillmentTime,
  customer,

  paymentMethod,
  paymentStatus: paymentMethod === "paynow" ? "pending" : "paid",
   paymentProof: paymentMethod === "paynow" ? paymentProof || null : null, // ✅ ADD

  pickupLocation: bakeryPickupLocation,

  deliveryAddress:
    fulfillmentType === "delivery"
      ? {
          addressText: customer.address,
          postalCode: customer.postalCode,
          area: validatedArea, // ✅ NEW
        }
      : null,

  items,
  subtotal,
  deliveryFee,
  totalAmount,
  lalamoveStatus,
});

if (paymentMethod === "paynow") {
  const ADMIN_EMAIL =
    process.env.ADMIN_ORDER_EMAIL || process.env.MAIL_FROM_EMAIL;

  if (ADMIN_EMAIL) {
    sendEmail({
      to: ADMIN_EMAIL,
      subject: "🚨 New PayNow Order — Verification Needed",
      html: `
        <h2>New PayNow Order</h2>
        <p><b>Order ID:</b> ${order._id}</p>
        <p><b>Customer:</b> ${customer.firstName} ${customer.lastName}</p>
        <p><b>Phone:</b> ${customer.phone}</p>
        <p><b>Total:</b> SGD ${totalAmount}</p>
      `,
    }).catch(console.error);
  }

  if (customer.email) {
    sendEmail({
      to: customer.email,
      subject: "Order Received — Payment Verification Pending",
      html: `
        <h2>Order Received ✅</h2>
        <p>Your payment proof has been received.</p>
        <p>Admin is verifying payment.</p>
        <p><b>Order ID:</b> ${order._id}</p>
      `,
    }).catch(console.error);
  }
}


    return res.status(201).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }


  
};


export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("items.productId", "name");

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


export const bookLalamove = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.fulfillmentType !== "delivery") {
      return res.status(400).json({ message: "Not a delivery order" });
    }

    if (order.lalamoveStatus === "booked") {
      return res.status(400).json({ message: "Already booked" });
    }

    if (!order.pickupLocation || !order.deliveryAddress) {
      return res.status(400).json({
        message: "Missing pickup or delivery address",
      });
    }

    order.lalamoveStatus = "booking_requested";
    await order.save();

    const result = await createLalamoveOrder(order);

    order.lalamoveBookingId = result.data.orderId;
    order.lalamoveTrackingLink = result.data.shareLink;
    order.lalamoveStatus = "booked";

    await order.save();

    return res.json({ success: true, result });

  } catch (err) {
    console.error("Lalamove booking error:");
    console.error(err.response?.data || err.message || err);

    await Order.findByIdAndUpdate(req.params.id, {
      lalamoveStatus: "failed",
    });

    return res.status(500).json({
      message: err.response?.data || err.message || "Lalamove booking failed",
    });
  }
};
