const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const router = express.Router();

// Configuración de Multer para subir archivos .json
const upload = multer({ dest: 'uploads/' });

// Ruta que recibe un archivo JSON y una pregunta
router.post('/ask', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const question = req.body.question;

    const prompt = `Este es el contenido del archivo JSON:\n${jsonData}\n\nAhora respondé lo siguiente: ${question}`;

    // Ejecutar comando con Ollama
    exec(`echo "${prompt}" | ollama run mistral`, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
      fs.unlinkSync(filePath); // Borrar el archivo temporal

      if (error) {
        console.error('Error al ejecutar Ollama:', error);
        return res.status(500).json({ error: 'Error al ejecutar el modelo Mistral.' });
      }

      return res.json({ answer: stdout.trim() });
    });

  } catch (err) {
    console.error('Error al procesar la solicitud:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
