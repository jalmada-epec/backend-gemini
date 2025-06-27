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

async function analizarDocumentoConGemini(nombre, buffer, mimeType, instruccion) {
  const base64Data = buffer.toString('base64');

  const texto = `Analiza el siguiente documento (${nombre}) siguiendo la siguiente instruccion: ${instruccion}`;


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
            text: texto,
          },
        ],
      },
    ],
  };

  console.log('Texto enviado a Gemini:', texto);  

  const response = await axios.post(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[Sin respuesta]';
}

//router.post('/ask', async (req, res) => {
router.post('/askSolicitudCompleta', async (req, res) => {
  const { solicitud, documentos } = req.body;

  if (!Array.isArray(documentos)) {
    return res.status(400).json({ error: 'Formato incorrecto: se esperaba un array de documentos.' });
  }

  try {
    const resultados = [];

    for (const doc of documentos) {
      const { tipo, url, instruccion, sdt_nro} = doc;
      //const mimeType = detectarMime(url);
      let mimeType = detectarMime(url);

      // Si no se detectó por extensión, intentamos con Content-Type
      /*if (!mimeType) {
        mimeType = response.headers['content-type'];
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        //resultados.push(`📄 *${tipo}*: Tipo de archivo no soportado (${mimeType || 'desconocido'})`);
        resultados.push({
          tipo,
          sdt_nro,
          estado: 'error',
          mensaje: `Tipo de archivo no soportado (${mimeType || 'desconocido'})`
        });
        continue;
      }*/

      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        // Si no se detectó por extensión, intentamos con Content-Type
        if (!mimeType) {
          mimeType = response.headers['content-type'];
        }

        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
          //resultados.push(`📄 *${tipo}*: Tipo de archivo no soportado (${mimeType || 'desconocido'})`);
          resultados.push({
            tipo,
            sdt_nro,
            estado: 'error',
            mensaje: `Tipo de archivo no soportado (${mimeType || 'desconocido'})`
          });
          continue;
        }

        const buffer = Buffer.from(response.data);

        console.log(`✅ Descargado ${url}`);
        console.log(`📦 Tamaño: ${buffer.length} bytes`);
        console.log(`🧾 Tipo MIME: ${mimeType}`);

        if (buffer.length > MAX_SIZE) {
          //resultados.push(`📄 *${tipo}*: Archivo demasiado grande (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
          resultados.push({
            tipo,
            sdt_nro,
            estado: 'error',
            mensaje: `Archivo demasiado grande (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`
          });
          continue;
        }

        const resumen = await analizarDocumentoConGemini(tipo, buffer, mimeType,instruccion);
        //resultados.push(`📄 *${tipo}*: ${resumen}`);
        resultados.push({
          tipo,
          sdt_nro,
          estado: 'procesado',
          resumen: resumen
        });
      } catch (error) {
        console.error(`❌ Error al procesar ${url}:`, error.message);
        //resultados.push(`📄 *${tipo}*: Error al procesar documento (${error.message})`);
        resultados.push({
          tipo,
          sdt_nro,
          estado: 'error',
          mensaje: `Error al procesar documento (${error.message})`
        });
      }
    }

    //res.json({ solicitud, resumen: resultados.join('\n\n') });
    res.json({
      solicitud,
      documentos: resultados
    });
  } catch (error) {
    console.error('❌ Error general:', error.message);
    res.status(500).json({
      error: 'Error al procesar los documentos',
      detalle: error.message,
      status: error.response?.status,
      url: error.config?.url
    });
  }
});

router.post('/askFile', async (req, res) => {
  const { instruccion, url } = req.body;

  if (!instruccion || !url) {
    return res.status(400).json({ error: 'Faltan parámetros: instruccion y url son obligatorios.' });
  }

  //const mimeType = detectarMime(url);
  let mimeType = detectarMime(url);

  // Si no se detectó por extensión, intentamos con Content-Type
  /*if (!mimeType) {
    mimeType = response.headers['content-type'];
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return res.status(400).json({
      estado: 'error',
      mensaje: `Tipo de archivo no soportado (${mimeType || 'desconocido'})`
    });
  }*/

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    // Si no se detectó por extensión, intentamos con Content-Type
    if (!mimeType) {
      mimeType = response.headers['content-type'];
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({
        estado: 'error',
        mensaje: `Tipo de archivo no soportado (${mimeType || 'desconocido'})`
      });
    }


    const buffer = Buffer.from(response.data);

    console.log(`✅ Descargado ${url}`);
    console.log(`📦 Tamaño: ${buffer.length} bytes`);
    console.log(`🧾 Tipo MIME: ${mimeType}`);

    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        estado: 'error',
        mensaje: `Archivo demasiado grande (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`
      });
    }

    const resumen = await analizarDocumentoConGemini('Archivo cargado', buffer, mimeType, instruccion);

    return res.json({
      estado: 'procesado',
      resumen: resumen
    });

  } catch (error) {
    console.error(`❌ Error al procesar ${url}:`, error.message);
    return res.status(500).json({
      estado: 'error',
      mensaje: `Error al procesar el archivo (${error.message})`
    });
  }
});

module.exports = router;
