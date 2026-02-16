import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const bakeryChatbot = async (req, res) => {
  try {
    const { message } = req.body;

    const prompt = `
You are a helpful AI assistant for a bakery website.

Rules:
- Answer only about bakery topics
- Be friendly and short
- Do not discuss politics or unrelated topics
- If unsure — say you will connect human support

Bakery Info:
- Custom cakes available
- Order 2–3 days in advance
- Same day delivery not guaranteed
- Delivery via partner service
- Payment: online + COD
- Refund only if order issue

Customer message:
${message}
`;

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt
    });

    res.json({
      reply: response.output_text
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Sorry — assistant is busy. Please contact bakery support."
    });
  }
};
