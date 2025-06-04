require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const geminiRoutes = require('./routes/gemini');
const jsonRoutes = require('./routes/json');
const jsonPorPartesRoutes = require('./routes/jsonxpartes');
const gptjsonRoutes = require('./routes/gptjson');
//const mistralRoute = require('./routes/mistraljson');
const mistralRoute = require('./routes/mistraljson');
const urlAskRoute = require('./routes/urlAsk');



const app = express();
const PORT = 3000;
//const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
// Rutas principales
app.use('/api/gemini', geminiRoutes);
app.use('/api/json', jsonRoutes);
app.use('/api/jsonxpartes', jsonPorPartesRoutes);
app.use('/api/gptjson', gptjsonRoutes);
//app.use('/api/mistral', mistralRoute);
app.use('/api/mistraljson', mistralRoute);
app.use('/api/url', urlAskRoute);



// Almacenamiento y subida simple (por si querés mantenerlo para tests)
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Archivo no encontrado');
  res.send({ message: 'Archivo subido', filename: req.file.filename });
});

// Endpoint para subir exclusivamente archivos JSON
app.post('/upload-json', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Archivo no encontrado');
  res.send({ message: 'Archivo JSON subido', filename: req.file.filename });
});



app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
//app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en http://0.0.0.0:${PORT}`));
