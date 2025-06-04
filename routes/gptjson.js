const express = require('express');
const fs = require('fs');
const { OpenAI } = require('openai');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/ask', async (req, res) => {
  const { filename, question } = req.body;
  const filePath = `./uploads/${filename}`;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const jsonString = JSON.stringify(JSON.parse(raw), null, 2);

    const prompt = `Este es el contenido de un archivo JSON con datos de facturación:\n\n${jsonString}\n\nAhora responde a la siguiente pregunta de análisis:\n${question}\n\nResponde solo en español y usando formato markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'Eres un analista financiero experto en facturación. Responde de forma clara y estructurada.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error('Error al procesar pregunta con GPT:', err);
    res.status(500).json({ error: 'Error procesando con GPT-4.' });
  }
});

module.exports = router;
