import OpenAI from "openai";
import MenuItem from "../models/MenuItem.js";
import Branch from "../models/Branch.js";
import Category from "../models/Category.js";
import Offer from "../models/Offer.js";
import Festival from "../models/Festival.js";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const bakeryChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    const now = new Date();
    const q = message.toLowerCase();

    /* =====================
   ✅ Custom Cake Intent
===================== */

const renderMessageText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#334b8f] underline font-medium break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};


const customKeywords = [
  "custom cake",
  "birthday cake",
  "wedding cake",
  "customise cake",
  "customize cake",
  "theme cake",
  "photo cake"
];

if (customKeywords.some(k => q.includes(k))) {
  return res.json({
reply:
"Yes 😊 Custom cakes are available. Please message us on WhatsApp: https://wa.me/6591111712 to customize and order."

  });
}



    /* =====================
       Branches
    ====================== */
    const branches = await Branch.find().select("name address");
    const branchText = branches.map(b =>
      `- ${b.name}: ${b.address}`
    ).join("\n");

    /* =====================
       Best Sellers
    ====================== */
    const bestSellers = await MenuItem
      .find({ isBestSeller: true, isAvailable: true })
      .limit(5)
      .select("name");

    const bestSellerText = bestSellers.map(p => `- ${p.name}`).join("\n");

    /* =====================
       Active Festival
    ====================== */
    const activeFestival = await Festival.findOne({ isActive: true });

    let festivalItemsText = "";

    if (activeFestival) {
      const festItems = await MenuItem
        .find({ festival: activeFestival._id, isAvailable: true })
        .limit(6)
        .select("name");

      festivalItemsText = festItems.map(i => `- ${i.name}`).join("\n");
    }

    /* =====================
       Active Offers
    ====================== */
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).limit(5);

    const offerText = activeOffers.map(o => {
      const val = o.type === "percent"
        ? `${o.value}% off`
        : `$${o.value} off`;

      return `- ${o.title}: ${val} (applies to ${o.appliesTo})`;
    }).join("\n");

    /* =====================
       Product Match
    ====================== */
    const matchedProducts = await MenuItem.find({
      name: { $regex: message, $options: "i" },
      isAvailable: true
    })
      .limit(3)
      .select("name description servingInfo preorder variants");


  const productKnowledge = matchedProducts.map(p => {
  const priceText = p.variants?.length
    ? p.variants.map(v => `${v.label}: $${v.price}`).join(", ")
    : "price not set";

  return `
Product: ${p.name}
Serving: ${p.servingInfo || "not specified"}
Preorder: ${p.preorder?.enabled ? `${p.preorder.minDays} days` : "not required"}
Prices: ${priceText}
Description: ${p.description || ""}
`;
}).join("\n");


    /* =====================
       Prompt
    ====================== */
    const systemPrompt = `
You are the official AI assistant for One18 Bakery Singapore.

Owner: Mahdi BamadhaJ
100% Halal • Muslim Owned • No preservatives • Fresh daily

Branches:
${branchText}

Best Sellers:
${bestSellerText}

${activeFestival ? `Active Festival: ${activeFestival.name}
Festival Items:
${festivalItemsText}` : ""}

Current Offers:
${offerText || "No active offers right now"}

Matched Product Info:
${productKnowledge}

Rules:
- Friendly short replies
- Use provided data only
- Use provided price data only — never guess prices
- If unsure → tell user to contact bakery
`;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error("CHATBOT ERROR:", err);
    res.json({
      reply: "Assistant temporarily unavailable.",
    });
  }
};
