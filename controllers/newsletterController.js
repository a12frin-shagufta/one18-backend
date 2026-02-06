import Newsletter from "../models/newsletterModel.js";

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email required" });
    }

    const exists = await Newsletter.findOne({ email });

    if (exists) {
      return res.json({ message: "Already subscribed" });
    }

    await Newsletter.create({ email });

    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error("Newsletter error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getNewsletterSubscribers = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Newsletter.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Newsletter.countDocuments()
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Newsletter list error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
