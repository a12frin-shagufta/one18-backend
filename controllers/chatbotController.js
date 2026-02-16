import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const bakeryChatbot = async (req, res) => {
  try {
    const { message } = req.body;

    const systemPrompt = `
You are the official AI assistant for One18 Bakery in Singapore.

Business Facts (must follow exactly):

Branches:
1) Blk 826 Tampines Street 81, Singapore
2) 757 North Bridge Rd, Singapore 198725

About:
- 100% Halal
- 100% Muslim Owned
- Premium ingredients used
- No preservatives
- Custom cakes and specialty croissants available

Ordering Rules:
- Orders must be booked at least 3 days in advance
- Same-day orders are usually not available
- For urgent cases → ask customer to contact bakery directly

Best Seller Items:
- Supreme Sambal Tumis Ikan Bilis Croissant
- Supreme Beef Rendang Croissant
- Supreme Fried Chicken Satay Croissant
- Supreme Pistachio Croissant

Assistant Behavior Rules:
- Answer short, friendly, and confident
- Only answer bakery-related questions
- Do NOT invent prices
- Do NOT invent new branches
- If something is unknown → say: “Please contact our bakery support for confirmation.”
- Do not discuss politics or unrelated topics
`;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4o-mini", // ✅ cheap + good
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });
  } catch (err) {
    console.error("OPENROUTER ERROR:", err.message);

    res.json({
      reply:
        "Assistant temporarily unavailable. Please contact bakery support.",
    });
  }
};
