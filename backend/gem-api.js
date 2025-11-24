const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt) {
  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 2048
    }
  };

  try {
    const response = await axios.post(GEMINI_API_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return { text };

  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    throw new Error(err.response?.data?.error ?? "Gemini API call failed");
  }
}

module.exports = { callGemini };