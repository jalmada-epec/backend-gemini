require('dotenv').config();
const express = require('express');
const urlAskRoute = require('./routes/urlAsk');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/solicitudes-ia', urlAskRoute);

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

