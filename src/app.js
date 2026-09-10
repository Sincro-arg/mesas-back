const express = require('express');
const cors = require('cors');
const {
  ESTADOS_MESA,
  TRANSICIONES_VALIDAS,
  mesas,
  buscarMesa,
  pedidosAbiertosDeMesa,
} = require('./data/store');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/salud', (req, res) => {
  res.json({ ok: true, servicio: 'mesas-back', timestamp: new Date().toISOString() });
});

app.get('/api/mesas', (req, res) => {
  res.json(mesas);
});

app.get('/api/mesas/:id', (req, res) => {
  const numero = Number(req.params.id);
  const mesa = buscarMesa(numero);
  if (!mesa) {
    return res.status(404).json({ error: `No existe una mesa con id ${req.params.id}` });
  }
  res.json({ ...mesa, pedidos: pedidosAbiertosDeMesa(numero) });
});

app.post('/api/mesas/:id/estado', (req, res) => {
  const numero = Number(req.params.id);
  const mesa = buscarMesa(numero);
  if (!mesa) {
    return res.status(404).json({ error: `No existe una mesa con id ${req.params.id}` });
  }

  const { estado } = req.body;
  if (!estado) {
    return res.status(400).json({ error: 'Falta el campo estado en el body' });
  }
  if (!Object.values(ESTADOS_MESA).includes(estado)) {
    return res.status(400).json({ error: `Estado invalido: ${estado}` });
  }

  const transicionesPosibles = TRANSICIONES_VALIDAS[mesa.estado] || [];
  if (!transicionesPosibles.includes(estado)) {
    return res.status(400).json({
      error: `No se puede pasar una mesa de "${mesa.estado}" a "${estado}"`,
    });
  }

  mesa.estado = estado;
  res.json(mesa);
});

module.exports = app;
