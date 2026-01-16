import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

const HOURS_2 = 2;
const DAYS_3 = 3;

const addHours = (date, hours) => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const createOrder = async (req, res) => {
  try {
    const {
      branch,
      orderType,
      fulfillmentType,

      fulfillmentDate,
      fulfillmentTime,

      customer,
      deliveryAddress,
      pickupLocation,

      items,
      subtotal,
      deliveryFee,
      totalAmount,
    } = req.body;

    // ✅ BASIC VALIDATION
    if (!orderType || !fulfillmentType || !customer || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!fulfillmentDate || !fulfillmentTime) {
      return res.status(400).json({ message: "Please select date and time" });
    }

    if (!customer.firstName || !customer.lastName || !customer.phone) {
      return res.status(400).json({ message: "Customer details missing" });
    }

   // ✅ DELIVERY needs address + postal
if (fulfillmentType === "delivery") {
  if (!customer.address || !customer.postalCode) {
    return res.status(400).json({ message: "Address and postal code required" });
  }
}


    const now = new Date();

    // ✅ SAME-DAY ORDER VALIDATION
    if (orderType === "WALK_IN") {
      // if today order, keep your 2 hours validation (optional)
      // you can skip this if you want
      const selectedDate = new Date(`${fulfillmentDate}T00:00:00`);

const minAllowedDate = addDays(new Date(), DAYS_3);
minAllowedDate.setHours(0, 0, 0, 0); // ✅ remove time

if (selectedDate < minAllowedDate) {
  return res.status(400).json({
    message: "Pre-orders require minimum 3 working days",
  });
}

    }

    // ✅ PRE-ORDER VALIDATION (3 days minimum)
    if (orderType === "PREORDER") {
      const selectedDate = new Date(`${fulfillmentDate}T00:00:00`);
      const minAllowedDate = addDays(now, DAYS_3);

      if (selectedDate < minAllowedDate) {
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

      deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress : null,
      pickupLocation: fulfillmentType === "pickup" ? pickupLocation : null,

      items,
      subtotal,
      deliveryFee,
      totalAmount,
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
