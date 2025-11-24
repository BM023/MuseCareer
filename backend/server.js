require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { parseTextFromDataUrl } = require('./file-base64');
const { callGemini } = require('./gem-api');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JSON_PROMPT_SUFFIX = `
IMPORTANT: Respond with a single VALID JSON object ONLY (no extra commentary).
The JSON object must match this schema:

{
  "summary": "<overall CV analysis summary>",
  "recommendations": [
    { "title": "<recommendation title>", "page_content": "<detailed recommendation>" }
  ]
}

Return only the JSON object and nothing else.
`;

function buildPrompt(cv_text, interests) {
  return `
You are an expert career counselor and CV reviewer. Analyze this CV/resume and the user’s interests, then respond strictly in JSON as described below.

CV Content:
${cv_text}

User Interests: ${interests}

Instructions:
- Provide a concise but comprehensive overall analysis in the "summary" field.
- Provide 3-4 actionable recommendations in the "recommendations" array. Each recommendation must have:
    - "title": short label of the recommendation (e.g., "Improve LinkedIn Profile")
    - "page_content": detailed advice, bullet points, or steps.
- Include advice on skills, experience, career paths, CV improvement, and an action plan **inside summary or each recommendation as appropriate**.
- Be encouraging and constructive.
- Do NOT include any text outside the JSON object.

${JSON_PROMPT_SUFFIX}
`;
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/prod', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !Array.isArray(body.contents) || body.contents.length === 0) {
      return res.status(400).json({ error: 'Invalid payload: contents required' });
    }

    const parts = body.contents[0].parts || [];
    const textParts = parts.filter(p => p.text).map(p => p.text).join('\n\n');
    const inline = parts.find(p => p.inlineData);
    const extraPromptText = textParts || '';

    let fileText = '';
    if (inline && inline.inlineData) {
      const { mimeType, data } = inline.inlineData;
      if (!data) return res.status(400).json({ error: 'inlineData.data missing' });
      try {
        fileText = await parseTextFromDataUrl(data, mimeType || '');
      } catch (err) {
        console.error('File parse error:', err);
        return res.status(500).json({ error: 'Failed to parse uploaded file: ' + err.message });
      }
    }

    const prompt = buildPrompt(fileText, extraPromptText);

    const { text: modelText } = await callGemini(prompt);

    let parsed = null;
    try {
      const firstBrace = modelText.indexOf('{');
      const lastBrace = modelText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        parsed = JSON.parse(modelText.slice(firstBrace, lastBrace + 1));
      } else {
        parsed = JSON.parse(modelText);
      }
    } catch (e) {
      console.warn('Failed to parse model JSON:', e.message);
      return res.status(502).json({
        error: 'LLM returned non-JSON or unparsable JSON.',
        llm_text: modelText
      });
    }

    return res.json(parsed);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MuseCareer backend listening on ${PORT}`));