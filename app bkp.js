require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const geminiRoutes = require('./routes/gemini');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api/gemini', geminiRoutes);

// Almacenamiento local de archivos
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Endpoint para subir archivos
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Archivo no encontrado');
  res.send({ message: 'Archivo subido', filename: req.file.filename });
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));