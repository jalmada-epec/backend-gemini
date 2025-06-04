const fs = require('fs');
const pdf = require('pdf-parse');

async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

module.exports = { extractTextFromPDF };