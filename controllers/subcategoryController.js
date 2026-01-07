import Subcategory from "../models/Subcategory.js";

// GET subcategories (optionally by category)
export const getSubcategories = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = category ? { category } : {};
    const subcategories = await Subcategory.find(filter).populate(
      "category",
      "name"
    );

    res.json(subcategories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD subcategory
export const addSubcategory = async (req, res) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Name & category required" });
    }

    const subcategory = await Subcategory.create({
      name,
      category,
    });

    res.json(subcategory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE subcategory
export const deleteSubcategory = async (req, res) => {
  try {
    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
