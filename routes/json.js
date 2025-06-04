const express = require('express');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/json/ask
router.post('/ask', async (req, res) => {
  const { filename, question } = req.body;
  const filePath = `./uploads/${filename}`;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');

    // Validar JSON
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      return res.status(400).json({ error: 'El archivo no es un JSON válido.' });
    }

    //const jsonText = JSON.stringify(data, null, 2).slice(0, 100000); // Seguridad
    //const jsonText = JSON.stringify(data, null, 2).slice(0, 250000); // Seguridad
    const jsonText = JSON.stringify(data, null, 2).slice(0, 500000);
    //const jsonText = JSON.stringify(data, null, 2); // sin slice  You exceeded your current quota, please check your plan and billing details

    

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });    
    //const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });    
    

    
    
    const result = await model.generateContent(`Tengo el siguiente archivo JSON:\n${jsonText}\n\nPregunta: ${question}`);

    

    const response = await result.response;
    const text = response.text();

    res.json({ answer: text });
  } catch (err) {
    console.error('Error al procesar pregunta JSON:', err);
    res.status(500).json({ error: 'Error procesando la pregunta.' });
  }
});

module.exports = router;
