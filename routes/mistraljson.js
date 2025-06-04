const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { spawn } = require('child_process');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

//router.post('/api/mistraljson/ask', upload.single('file'), async (req, res) => {
router.post('/ask', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const userQuestion = req.body.question || 'Analiza este archivo JSON y proporciona un resumen útil para facturación empresarial.';
    //const fullPrompt = `${userQuestion}\n\nEste es el archivo JSON:\n\n${fileContent}`;
    const fullPrompt = `Eres un asistente experto en análisis de archivos JSON. Pregunta del usuario: "${userQuestion}"Contenido del archivo JSON:${fileContent}Por favor, analiza el JSON y responde solo con la información solicitada.`;

    //const userQuestion = req.body.question || '¿Cuántos días tiene un año bisiesto?';
    //const fullPrompt = userQuestion;
    //const fullPrompt = `### Instrucción:\n${userQuestion}\n\n### Respuesta:\n`;




    const ollamaProcess = spawn('ollama', ['run', 'mistral'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let response = '';
    let errorOutput = '';

    ollamaProcess.stdout.on('data', (data) => {
      response += data.toString();
    });

    ollamaProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ollamaProcess.on('close', (code) => {
      fs.unlinkSync(filePath); // borrar archivo temporal

      if (code !== 0) {
        console.error('Error al ejecutar Ollama:', errorOutput);
        return res.status(500).json({ error: 'Error al procesar el archivo con Mistral.' });
      }

      res.json({ result: response.trim() });
    });

    // Enviar el prompt por stdin
    ollamaProcess.stdin.write(fullPrompt);
    ollamaProcess.stdin.end();

  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
