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
