require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
  const { recipient, purpose, tone, details } = req.body || {};

  if (!purpose || !String(purpose).trim()) {
    return res.status(400).json({ error: "Please enter the purpose of the email." });
  }

  // Demo mode works without an API key. It uses a simple template, not an AI model.
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "put_your_api_key_here") {
    const greeting = recipient && recipient.trim() ? `Dear ${recipient.trim()},` : "Hello,";
    const toneLine = tone === "Friendly"
      ? "I hope you're doing well!"
      : tone === "Casual"
      ? "Hope you're doing well."
      : "I hope this message finds you well.";
    const body = `${greeting}\n\n${toneLine}\n\nI am writing regarding ${purpose.trim()}.${details && details.trim() ? `\n\nAdditional details: ${details.trim()}` : ""}\n\nPlease let me know if you need any further information.\n\n${tone === "Casual" || tone === "Friendly" ? "Best," : "Regards,"}\n[Your Name]`;
    return res.json({
      subject: `Regarding ${purpose.trim().slice(0, 70)}`,
      body,
      mode: "demo"
    });
  }

  try {
    const OpenAI = require("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = [
      "Write a clear, useful email based on the user's details.",
      "Return only valid JSON with two string fields: subject and body.",
      "Do not invent facts or commitments. Use placeholders if information is missing.",
      `Recipient: ${recipient || "Not specified"}`,
      `Purpose: ${purpose}`,
      `Tone: ${tone || "Professional"}`,
      `Additional details: ${details || "None"}`
    ].join("\n");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a careful email-writing assistant. Return only JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (!result.subject || !result.body) throw new Error("The model returned an incomplete email.");
    return res.json({ subject: result.subject, body: result.body, mode: "ai" });
  } catch (error) {
    console.error("Email generation failed:", error.message);
    return res.status(500).json({
      error: "AI generation failed. Check your API key, internet connection, and API access. You can still use Demo Mode without a key."
    });
  }
});

app.listen(port, () => {
  console.log(`AI Email Generator running at http://localhost:${port}`);
});
