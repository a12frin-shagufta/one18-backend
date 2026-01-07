import Offer from "../models/Offer.js";

export const createOffer = async (req, res) => {
  try {
    const {
      title,
      type,
      value,
      appliesTo,
      products,
      startDate,
      endDate,
    } = req.body;

    if (!title || !type || !value || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const offer = await Offer.create({
      title,
      type,
      value,
      appliesTo,
      products: appliesTo === "selected" ? JSON.parse(products) : [],
      startDate,
      endDate,
    });

    res.json({ success: true, offer });
  } catch (err) {
    console.error("OFFER CREATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getOffers = async (req, res) => {
  const offers = await Offer.find().sort({ createdAt: -1 });
  res.json(offers);
};

export const deleteOffer = async (req, res) => {
  await Offer.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

export const toggleOffer = async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  offer.isActive = !offer.isActive;
  await offer.save();
  res.json({ success: true });
};
