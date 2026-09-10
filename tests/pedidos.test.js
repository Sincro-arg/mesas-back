const request = require('supertest');
const app = require('../src/app');
const { seed } = require('../src/data/store');

beforeEach(() => {
  seed();
});

describe('GET /api/pedidos', () => {
  it('devuelve los pedidos abiertos con su total calculado', async () => {
    const res = await request(app).get('/api/pedidos');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((pedido) => {
      expect(pedido.abierto).toBe(true);
      const totalEsperado = pedido.items.reduce(
        (acc, item) => acc + item.precio * item.cantidad,
        0
      );
      expect(pedido.total).toBe(totalEsperado);
    });
  });
});

describe('POST /api/pedidos', () => {
  it('abre un pedido nuevo en una mesa libre y la pasa a ocupada', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({
        mesaNumero: 2,
        items: [
          { nombre: 'Pizza muzzarella', cantidad: 1 },
          { nombre: 'Agua mineral', cantidad: 2 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.mesaNumero).toBe(2);
    expect(res.body.abierto).toBe(true);
    expect(res.body.total).toBe(7200 + 1200 * 2);

    const mesa = await request(app).get('/api/mesas/2');
    expect(mesa.body.estado).toBe('ocupada');
  });

  it('400 cuando falta el campo mesaNumero', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({ items: [{ nombre: 'Agua mineral', cantidad: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 cuando la mesa no existe', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({ mesaNumero: 999, items: [{ nombre: 'Agua mineral', cantidad: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 cuando faltan los items', async () => {
    const res = await request(app).post('/api/pedidos').send({ mesaNumero: 2 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 cuando un item tiene cantidad invalida', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({ mesaNumero: 2, items: [{ nombre: 'Agua mineral', cantidad: 0 }] });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 cuando un item no existe en el menu', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .send({ mesaNumero: 2, items: [{ nombre: 'Sushi', cantidad: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/pedidos/:id/cerrar', () => {
  it('cierra el pedido y libera la mesa si no quedan otros pedidos abiertos', async () => {
    const res = await request(app).post('/api/pedidos/1/cerrar');
    expect(res.status).toBe(200);
    expect(res.body.abierto).toBe(false);

    const mesa = await request(app).get('/api/mesas/1');
    expect(mesa.body.estado).toBe('libre');
  });

  it('mantiene la mesa ocupada si quedan otros pedidos abiertos', async () => {
    const nuevo = await request(app)
      .post('/api/pedidos')
      .send({ mesaNumero: 1, items: [{ nombre: 'Agua mineral', cantidad: 1 }] });
    expect(nuevo.status).toBe(201);

    const cierre = await request(app).post('/api/pedidos/1/cerrar');
    expect(cierre.status).toBe(200);

    const mesa = await request(app).get('/api/mesas/1');
    expect(mesa.body.estado).toBe('ocupada');
  });

  it('404 cuando el pedido no existe', async () => {
    const res = await request(app).post('/api/pedidos/999/cerrar');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
