const { GoogleAuth } = require('google-auth-library');

const GEMINI_MODEL = 'models/gemini-1.5'; // or your preferred model
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/';

async function callGemini(prompt, temperature = 0.2) {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  const res = await fetch(`${BASE_URL}${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken.token || accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: { text: prompt },
      temperature,
      maxOutputTokens: 1024
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM request failed ${res.status}: ${text}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.[0]?.text || json.outputText || JSON.stringify(json);

  return { raw: json, text };
}

module.exports = { callGemini };
