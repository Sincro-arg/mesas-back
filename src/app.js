const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/salud', (req, res) => {
  res.json({ ok: true, servicio: 'mesas-back', timestamp: new Date().toISOString() });
});

module.exports = app;
