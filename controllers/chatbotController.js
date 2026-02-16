import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

export const bakeryChatbot = async (req, res) => {
  try {
    const { message } = req.body;

    const systemPrompt = `
You are a helpful bakery website assistant.
Answer short and friendly.
Only answer bakery related questions.
If unsure, tell user to contact bakery support.
`;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",   // ✅ cheap + good
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (err) {
    console.error("OPENROUTER ERROR:", err.message);

    res.json({
      reply: "Assistant temporarily unavailable. Please contact bakery support."
    });
  }
};
