const express = require('express');
const axios = require('axios');
const path = require('path');
const router = express.Router();
const { Buffer } = require('buffer');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function detectarMime(url) {
  const ext = path.extname(url).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return null;
}

async function analizarDocumentoConGemini(nombre, buffer, mimeType) {
  const base64Data = buffer.toString('base64');

  const payload = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: `Analiza el siguiente documento (${nombre}) y proporciona un resumen útil para controles administrativos.`,
          },
        ],
      },
    ],
  };

  const response = await axios.post(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[Sin respuesta]';
}

router.post('/ask', async (req, res) => {
  const { solicitud, documentos } = req.body;

  if (!documentos || !Array.isArray(documentos)) {
    return res.status(400).json({ error: 'Formato incorrecto: se esperaba un array de documentos.' });
  }

  try {
    const resultados = [];

    for (const doc of documentos) {
      const { tipo, url } = doc;

      try {
        // Descargar archivo
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Detectar MIME básico por extensión
        const ext = path.extname(url).toLowerCase();
        let mimeType = 'application/pdf';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.png') mimeType = 'image/png';

        // Llamar a Gemini
        const resumen = await analizarDocumentoConGemini(tipo, buffer);

        resultados.push({
          tipo,
          estado: 'procesado',
          resumen
        });

      } catch (error) {
        console.error(`Error procesando documento "${tipo}":`, error.message);
        resultados.push({
          tipo,
          estado: 'error',
          resumen: `Error al procesar documento: ${error.message}`
        });
      }
    }

    res.json({
      solicitud,
      documentos: resultados
    });

  } catch (error) {
    console.error('Error general:', error.message);
    res.status(500).json({
      error: 'Error al procesar los documentos',
      detalle: error.message
    });
  }
});

module.exports = router;
