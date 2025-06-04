const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Configura tu API Key de Gemini (debería estar en el archivo .env)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
//const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';


// Función auxiliar para descargar archivo desde URL a un stream en memoria
async function downloadFileStream(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Función para crear la request a Gemini con el archivo como input multimodal
async function analizarDocumentoConGemini(nombre, buffer) {
  const base64Data = buffer.toString('base64');

  const payload = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf', // TODO: mejorar soporte si vienen JPG, PNG, etc.
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
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[Sin respuesta]';
}

// Endpoint principal
router.post('/ask', async (req, res) => {
  const { solicitud, documentos } = req.body;

  if (!documentos || !Array.isArray(documentos)) {
    return res.status(400).json({ error: 'Formato incorrecto: se esperaba un array de documentos.' });
  }

  try {
    const resultados = [];

    for (const doc of documentos) {
      const { tipo, url } = doc;
      let buffer; // <- Definilo antes del try
      try {
            // Descargar archivo      
            //const response = await axios.get(url, { responseType: 'arraybuffer' });
            const response = await axios.get(encodeURI(url), { responseType: 'arraybuffer' });

             buffer = Buffer.from(response.data);
      } catch (error) {
            console.error(`Error al descargar archivo desde ${url}`);
            console.error('Código de error HTTP:', error.response?.status);
            console.error('Contenido del error:', error.response?.data);
            throw new Error(`No se pudo descargar el archivo desde ${url}`);
      }

      // Detectar MIME básico por extensión (mejorable)
      const ext = path.extname(url).toLowerCase();
      let mimeType = 'application/pdf';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';

      // Llamar a Gemini
      const resumen = await analizarDocumentoConGemini(tipo, buffer);

      resultados.push(`📄 *${tipo}*: ${resumen}`);
    }

    // Concatenar resúmenes
    const resumenFinal = resultados.join('\n\n');
    res.json({ solicitud, resumen: resumenFinal });
  } catch (error) {
    console.error('Error al procesar documentos:', error.message);
    //res.status(500).json({ error: 'Error al procesar los documentos' });
    res.status(500).json({
            error: 'Error al procesar los documentos',
            detalle: error.message,
            status: error.response?.status,
            url: error.config?.url
        });

  }
});

module.exports = router;
