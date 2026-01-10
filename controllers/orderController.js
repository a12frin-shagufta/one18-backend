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
  pickupDate,
  customer,
  deliveryAddress,
  pickupLocation,
  items,
  subtotal,
  deliveryFee,
  totalAmount,
} = req.body;


   if (!orderType || !customer || !items?.length) {
  return res.status(400).json({ message: "Missing required fields" });
}

const now = new Date();

// 🟢 SAME-DAY ORDER
if (orderType === "SAME_DAY") {
  if (!pickupDate) {
    return res.status(400).json({ message: "Pickup time required" });
  }

  const minAllowedTime = addHours(now, HOURS_2);

  if (new Date(pickupDate) < minAllowedTime) {
    return res.status(400).json({
      message: "Same-day orders require at least 2 hours preparation",
    });
  }
}

// 🔵 PRE-ORDER
if (orderType === "PREORDER") {
  if (!pickupDate) {
    return res.status(400).json({ message: "Pickup date required" });
  }

  const minAllowedDate = addDays(now, DAYS_3);

  if (new Date(pickupDate) < minAllowedDate) {
    return res.status(400).json({
      message: "Pre-orders require minimum 3 working days",
    });
  }
}

    if (!branch) {
  return res.status(400).json({ message: "Branch is required" });
}

// 🔒 VALIDATE ITEMS AGAINST ORDER TYPE
for (const orderItem of items) {
  const menuItem = await MenuItem.findById(orderItem.productId);

  if (!menuItem) {
    return res.status(400).json({
      message: "Invalid product in order",
    });
  }

  // ❌ Pre-order product ordered as WALK_IN
  if (menuItem.preorder?.enabled && orderType === "WALK_IN") {
    return res.status(400).json({
      message: `${menuItem.name} is a pre-order item and cannot be ordered as same-day`,
    });
  }

  // ❌ Same-day product ordered as PREORDER
  if (!menuItem.preorder?.enabled && orderType === "PREORDER") {
    return res.status(400).json({
      message: `${menuItem.name} is a same-day item and cannot be pre-ordered`,
    });
  }
}

   
   const order = await Order.create({
  branch,
  orderType,
  fulfillmentType,
  pickupDate: orderType === "PREORDER" ? pickupDate : null,
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

