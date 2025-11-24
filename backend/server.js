require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { parseTextFromDataUrl } = require('./file-base64');
const { callGemini } = require('./gem-api');

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));

const PORT = process.env.PORT || 3000;

const JSON_PROMPT_SUFFIX = `
IMPORTANT: Respond with a single VALID JSON object ONLY (no extra commentary).
The JSON must match:

{
  "summary": "<overall CV analysis summary>",
  "recommendations": [
    { "title": "<recommendation title>", "page_content": "<detailed recommendation>" }
  ]
}

Return only the JSON object.
`;

function buildPrompt(cv_text, interests) {
  return `
You are an expert career counselor and CV reviewer. 
Analyze this CV/resume and the user’s interests, then respond according to the instructions below.

CV Content:
${cv_text}

User Interests:
${interests}

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

app.get('/health', (req, res) => {
  res.json({ ok: true, message: "Gemini CV Analyzer running." });
});

app.post('/prod', async (req, res) => {
  try {
    const body = req.body;
    if (!body?.contents?.length) {
      return res.status(400).json({ error: 'Invalid payload: contents required' });
    }

    const parts = body.contents[0].parts || [];

    const textParts = parts.filter(p => p.text).map(p => p.text).join('\n\n');
    const inline = parts.find(p => p.inlineData);
    const userPrompt = textParts || '';

    let fileText = '';
    if (inline?.inlineData?.data) {
      try {
        fileText = await parseTextFromDataUrl(
          inline.inlineData.data,
          inline.inlineData.mimeType || ''
        );
      } catch (err) {
        console.error("File parse error:", err);
        return res.status(500).json({ error: "File parsing failed." });
      }
    }

    const prompt = buildPrompt(fileText, userPrompt);
    const { text: modelText } = await callGemini(prompt);

    let parsedJSON;
    try {
      const first = modelText.indexOf('{');
      const last = modelText.lastIndexOf('}');
      parsedJSON = JSON.parse(modelText.slice(first, last + 1));
    } catch (e) {
      return res.status(502).json({
        error: "Model returned invalid JSON",
        raw: modelText
      });
    }

    res.json(parsedJSON);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`MuseCareer CV Analyzer running on port ${PORT}`);
});