import Order from "../models/Order.js";

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

    if (!branch) {
  return res.status(400).json({ message: "Branch is required" });
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

