const pdf = require('pdf-parse');
const mammoth = require('mammoth');

function stripDataUrlPrefix(dataUrl) {
  // data:[mime];base64,AAAA...
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return dataUrl;
  return dataUrl.slice(comma + 1);
}

async function parseTextFromDataUrl(dataUrl, mimeType) {
  const base64 = stripDataUrlPrefix(dataUrl);
  const buffer = Buffer.from(base64, 'base64');

  // handle text/* first
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    return buffer.toString('utf8');
  }

  // PDFs
  if (mimeType === 'application/pdf') {
    try {
      const data = await pdf(buffer);
      return data.text || '';
    } catch (err) {
      throw new Error('Failed to parse PDF: ' + err.message);
    }
  }

  // DOCX
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' || mimeType.endsWith('.docx')) {
    try {
      // mammoth expects Buffer or file; use buffer
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err) {
      throw new Error('Failed to parse DOCX: ' + err.message);
    }
  }

  // fallback: try utf8 decode
  return buffer.toString('utf8');
}

module.exports = { parseTextFromDataUrl };
