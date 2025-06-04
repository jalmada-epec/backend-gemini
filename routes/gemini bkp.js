const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { extractTextFromPDF } = require('../utils/parser');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/ask', async (req, res) => {
  const { filename, question } = req.body;
  const filePath = `./uploads/${filename}`;

  try {
    const text = await extractTextFromPDF(filePath);

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Documento:\n${text}\n\nPregunta: ${question}`;
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.send({ answer: response });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;