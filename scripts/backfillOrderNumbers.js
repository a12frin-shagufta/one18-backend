import mongoose from "mongoose";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";

await mongoose.connect(process.env.MONGO_URI);

async function run() {
  console.log("🔧 Backfilling order numbers...");

  // get current counter
  let counter = await Counter.findOne({ name: "order" });
  if (!counter) {
    counter = await Counter.create({ name: "order", seq: 0 });
  }

  let seq = counter.seq;

  const orders = await Order.find({
    orderNumber: { $exists: false }
  }).sort({ createdAt: 1 });

  console.log("Orders needing numbers:", orders.length);

  for (const o of orders) {
    seq++;
    o.orderNumber = "#" + String(seq).padStart(4, "0");
    await o.save();
    console.log("Updated:", o._id, o.orderNumber);
  }

  counter.seq = seq;
  await counter.save();

  console.log("✅ Done");
  process.exit();
}

run();
