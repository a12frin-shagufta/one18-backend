import MenuItem from "../models/MenuItem.js";

// GET all promo-eligible items (public — for cart logic)
export const getPromoItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ isPromoEligible: true, isAvailable: true })
      .select("_id name images variants slug")
      .populate("category", "name");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH toggle promo eligibility — admin only
export const togglePromoEligible = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.isPromoEligible = !item.isPromoEligible;
    await item.save();

    res.json({ success: true, isPromoEligible: item.isPromoEligible });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};