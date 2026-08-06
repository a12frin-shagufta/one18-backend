import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://shagufta7572_db_user:6uHhm8yYVoduK9nx@cluster0.28jrlbz.mongodb.net";
const WORDING_FEE = 5; // SGD per item

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");

  const db = mongoose.connection.db;
  const orders = db.collection("orders");

  // Find all PAID orders that have items with a non-empty cakeMessage
  const results = await orders
    .aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.cakeMessage": { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $project: {
          orderNumber: 1,
          createdAt: 1,
          customerName: {
            $concat: [
              "$customer.firstName",
              " ",
              "$customer.lastName",
            ],
          },
          itemName: "$items.name",
          variant: "$items.variant",
          cakeMessage: "$items.cakeMessage",
          qty: "$items.qty",
          lostFee: { $multiply: ["$items.qty", WORDING_FEE] },
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  if (results.length === 0) {
    console.log("🎉 No affected orders found — no loss!");
    await mongoose.disconnect();
    return;
  }

  // Print each affected order
  console.log("═══════════════════════════════════════════════════");
  console.log("  AFFECTED ORDERS — Cake Wording Fee Not Charged");
  console.log("═══════════════════════════════════════════════════\n");

  let totalLost = 0;

  results.forEach((r, i) => {
    const date = new Date(r.createdAt).toLocaleDateString("en-SG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    console.log(
      `${i + 1}. ${r.orderNumber || "N/A"} | ${date} | ${r.customerName}`
    );
    console.log(
      `   Item: ${r.itemName} (${r.variant}) x${r.qty}`
    );
    console.log(`   Message: "${r.cakeMessage}"`);
    console.log(`   Lost: SGD $${r.lostFee.toFixed(2)}`);
    console.log("");

    totalLost += r.lostFee;
  });

  console.log("═══════════════════════════════════════════════════");
  console.log(`  TOTAL ORDERS AFFECTED:  ${results.length}`);
  console.log(`  TOTAL AMOUNT LOST:      SGD $${totalLost.toFixed(2)}`);
  console.log("═══════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});