const express = require('express');
const cors = require('cors');
const {
  ESTADOS_MESA,
  TRANSICIONES_VALIDAS,
  mesas,
  buscarMesa,
  buscarPedido,
  pedidosAbiertosDeMesa,
  pedidosAbiertos,
  crearPedido,
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

// Un item bien formado tiene un nombre no vacio y una cantidad entera positiva.
// El nombre existente en el menu lo valida crearPedido (tira si no lo encuentra).
function errorDeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Falta el campo items o esta vacio';
  }
  for (const item of items) {
    if (!item || typeof item.nombre !== 'string' || item.nombre.trim() === '') {
      return 'Cada item necesita un nombre valido';
    }
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      return `Cantidad invalida para el item "${item.nombre}"`;
    }
  }
  return null;
}

app.get('/api/pedidos', (req, res) => {
  res.json(pedidosAbiertos());
});

app.post('/api/pedidos', (req, res) => {
  const { mesaNumero, items } = req.body;

  if (mesaNumero === undefined) {
    return res.status(400).json({ error: 'Falta el campo mesaNumero en el body' });
  }

  const numero = Number(mesaNumero);
  const mesa = buscarMesa(numero);
  if (!mesa) {
    return res.status(400).json({ error: `No existe una mesa con numero ${mesaNumero}` });
  }

  const errorItems = errorDeItems(items);
  if (errorItems) {
    return res.status(400).json({ error: errorItems });
  }

  const especificacionItems = items.map((item) => [item.nombre, item.cantidad]);

  let pedido;
  try {
    pedido = crearPedido(numero, especificacionItems);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  mesa.estado = ESTADOS_MESA.OCUPADA;
  res.status(201).json(pedido);
});

app.post('/api/pedidos/:id/cerrar', (req, res) => {
  const id = Number(req.params.id);
  const pedido = buscarPedido(id);
  if (!pedido) {
    return res.status(404).json({ error: `No existe un pedido con id ${req.params.id}` });
  }

  pedido.abierto = false;

  const mesa = buscarMesa(pedido.mesaNumero);
  if (mesa && pedidosAbiertosDeMesa(mesa.numero).length === 0) {
    mesa.estado = ESTADOS_MESA.LIBRE;
  }

  res.json(pedido);
});

module.exports = app;
