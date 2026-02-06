import Offer from "../models/Offer.js";
import { sendNewsletterToAll } from "../utils/newsletterMailer.js";


export const createOffer = async (req, res) => {
  

  try {
    const {
      title,
      type,
      value,
      appliesTo,
      products,
      categories,
      festivals,
      startDate,
      endDate,
    } = req.body;

    if (!title || !type || !value || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const offerData = {
      title,
      type,
      value,
      appliesTo: appliesTo || "all",
      startDate,
      endDate,
      products: [],
      categories: [],
      festivals: [],
    };

    // ✅ Selected Products Offer
    if (appliesTo === "selected") {
      offerData.products =
        typeof products === "string" ? JSON.parse(products) : products || [];
    }

    // ✅ Category Offer
    if (appliesTo === "category") {
      offerData.categories =
        typeof categories === "string"
          ? JSON.parse(categories)
          : categories || [];
    }

    // ✅ Festival Offer
    if (appliesTo === "festival") {
      offerData.festivals =
        typeof festivals === "string"
          ? JSON.parse(festivals)
          : festivals || [];
    }

    const offer = await Offer.create(offerData);

    sendNewsletterToAll({
  subject: `New bakery offer — ${offer.title}`,
  html: `
    <h2>ONE18 Bakery Update</h2>

    <p>Hello 👋</p>

    <p>We’ve just launched a new limited-time offer:</p>

    <h3>${offer.title}</h3>

    <p>
      Discount: <b>${offer.value}${offer.type === "percent" ? "%" : ""}</b>
    </p>

    <p>
      Visit our website to explore the menu and order online.
    </p>

    <p>
      👉 https://one18bakery.com
    </p>

    <hr/>

    <p style="font-size:12px;color:#666">
      You received this email because you subscribed to ONE18 Bakery updates.
      Singapore.
    </p>
  `
});

    res.json({ success: true, offer });
  } catch (err) {
    console.error("OFFER CREATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getOffers = async (req, res) => {
  const offers = await Offer.find()
    .sort({ createdAt: -1 })
    .populate("categories", "name")
    .populate("festivals", "name slug")
    .populate("products", "name");

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
