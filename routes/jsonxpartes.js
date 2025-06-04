const express = require('express');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/ask', async (req, res) => {
  const { filename, question } = req.body;
  const filePath = `./uploads/${filename}`;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const jsonString = JSON.stringify(data, null, 2);

    // Dividir JSON en partes
    const chunkSize = 20000;
    const chunks = [];
    for (let i = 0; i < jsonString.length; i += chunkSize) {
      chunks.push(jsonString.slice(i, i + chunkSize));
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Iniciar el chat con una instrucción inicial
    /*const chat = model.startChat({
      systemInstruction: 'Responde únicamente en español y usando formato markdown.',
    });*/

    /*const chat = model.startChat({
        systemInstruction: "Voy a enviarte un archivo JSON por partes. No respondas nada todavía. Solo analiza. Al final haré una pregunta y responderas únicamente en español y usando formato markdown."
    });*/
    const chat = model.startChat();
    await chat.sendMessage(
      "Voy a enviarte un archivo JSON por partes. No respondas nada todavía. Solo analiza. Al final haré una pregunta y responderas únicamente en español y usando formato markdown."
    );

    // Enviar aviso de que se enviará un JSON en partes
    /*await chat.sendMessage(
      'Voy a enviarte un archivo JSON por partes. No respondas nada todavía. Solo analiza. Al final haré una pregunta.'
    );*/


    // Función para esperar
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


    // Enviar cada parte del JSON
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Enviando parte ${index + 1} de ${chunks.length}`);
      await chat.sendMessage(`Parte ${index + 1} del JSON:\n${chunk}`);
      // Esperar 46 segundos entre cada solicitud (o ajusta este valor según el tiempo de espera necesario)
      if (index < chunks.length - 1) {  // Evitar esperar después de la última parte
        console.log(`Esperando 46 segundos antes de enviar la siguiente parte...`);
        await sleep(50000); // 46 segundos
      }
    }

    // Finalmente enviar la pregunta
    const result = await chat.sendMessage(
      `Con base en todo el contexto anterior, responde la siguiente pregunta:\n${question}`
    );
    const response = await result.response;
    const answer = response.text();

    res.json({ answer });
  } catch (err) {
    console.error('Error al procesar JSON en partes:', err);
    res.status(500).json({ error: 'Error procesando el JSON en partes.' });
  }
});

module.exports = router;
