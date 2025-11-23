const fetch = require('node-fetch');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. LLM calls will fail without it.');
}

//model name
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-1.5';

async function callGemini(prompt, temperature = 0.2) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY env var.');

  const base = process.env.GEMINI_REST_URL || 'https://generativelanguage.googleapis.com/v1beta/';
  // endpoint: models/:generateText or :generateContent depending on API shape
  const url = `${base}${GEMINI_MODEL}:generateContent`;

  const body = {

    prompt: {
      text: prompt
    },
    temperature,
    maxOutputTokens: 1024
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GEMINI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM request failed ${res.status}: ${text}`);
  }

  const json = await res.json();
  let text = null;
  try {
    if (json.candidates && json.candidates[0]) {
      const cand = json.candidates[0];
      if (cand.content && Array.isArray(cand.content)) {
        for (const c of cand.content) {
          if (c.text) { text = c.text; break; }
        }
      } else if (cand.output) {
        text = cand.output;
      } else if (cand.text) text = cand.text;
    }
    if (!text && json.outputText) text = json.outputText;
    if (!text && json.output && Array.isArray(json.output)) {
      for (const o of json.output) {
        if (o.content && Array.isArray(o.content)) {
          for (const c of o.content) {
            if (c.text) { text = c.text; break; }
          }
        }
        if (text) break;
      }
    }
  } catch (e) {
    // fallback
  }

  if (!text) text = JSON.stringify(json);

  return { raw: json, text };
}

module.exports = { callGemini };
