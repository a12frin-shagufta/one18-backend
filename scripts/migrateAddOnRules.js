// scripts/migrateAddOnRules.js
//
// Old quantity groups stored the bundle total in `maxSelect`.
// New shape keeps `maxSelect` for price mode only and uses `totalQty` for
// quantity mode, plus step / minPerOption / maxOptions / totalRule.
//
// Run:  node -r dotenv/config scripts/migrateAddOnRules.js
// Dry run first: DRY_RUN=1 node -r dotenv/config scripts/migrateAddOnRules.js

import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";

const DRY_RUN = !!process.env.DRY_RUN;

await mongoose.connect(process.env.MONGO_URI);

async function run() {
  console.log(DRY_RUN ? "🔍 DRY RUN — nothing will be saved" : "🔧 Migrating add-on rules...");

  const items = await MenuItem.find({ "addOns.mode": "quantity" });
  console.log("Menu items with quantity groups:", items.length);

  let changed = 0;

  for (const item of items) {
    let touched = false;

    for (const group of item.addOns) {
      if (group.mode !== "quantity") continue;
      if (group.totalQty != null) continue; // already migrated

      group.totalQty = group.maxSelect ?? null;
      group.maxSelect = null;
      group.totalRule = "exact";

      // Safe defaults: no step or minimum until an admin sets one, so existing
      // bundles keep behaving as "any mix adding up to the total".
      if (group.step == null) group.step = 1;
      if (group.minPerOption == null) group.minPerOption = 0;
      if (group.maxOptions == null) group.maxOptions = null;

      // Per-option caps already existed as options[].maxQuantity — left alone.
      touched = true;
      console.log(`  ${item.name} → "${group.groupName}": totalQty=${group.totalQty}`);
    }

    if (touched) {
      changed++;
      if (!DRY_RUN) await item.save();
    }
  }

  console.log(DRY_RUN ? `Would update ${changed} item(s)` : `✅ Updated ${changed} item(s)`);
}

run()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());