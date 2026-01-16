import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import moment from "moment-timezone";

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
      deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress : null,
      pickupLocation: fulfillmentType === "pickup" ? pickupLocation : null,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
    });

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
