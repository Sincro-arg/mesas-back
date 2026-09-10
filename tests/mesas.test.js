const request = require('supertest');
const app = require('../src/app');
const { seed } = require('../src/data/store');

beforeEach(() => {
  seed();
});

describe('GET /api/mesas', () => {
  it('devuelve las 24 mesas con su estado', async () => {
    const res = await request(app).get('/api/mesas');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(24);
    expect(res.body[0]).toHaveProperty('numero');
    expect(res.body[0]).toHaveProperty('sector');
    expect(res.body[0]).toHaveProperty('estado');
  });
});

describe('GET /api/mesas/:id', () => {
  it('devuelve el detalle de una mesa ocupada con sus pedidos', async () => {
    const res = await request(app).get('/api/mesas/1');
    expect(res.status).toBe(200);
    expect(res.body.numero).toBe(1);
    expect(res.body.estado).toBe('ocupada');
    expect(res.body.pedidos.length).toBeGreaterThan(0);
  });

  it('devuelve una mesa libre con la lista de pedidos vacia', async () => {
    const res = await request(app).get('/api/mesas/2');
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('libre');
    expect(res.body.pedidos).toEqual([]);
  });

  it('404 cuando el id no existe', async () => {
    const res = await request(app).get('/api/mesas/999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/mesas/:id/estado', () => {
  it('permite una transicion valida (libre -> ocupada)', async () => {
    const res = await request(app).post('/api/mesas/2/estado').send({ estado: 'ocupada' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('ocupada');
  });

  it('permite cerrar la cuenta y liberar la mesa (cuenta-pedida -> libre)', async () => {
    const res = await request(app).post('/api/mesas/18/estado').send({ estado: 'libre' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('libre');
  });

  it('400 en una transicion sin sentido (libre -> cuenta-pedida)', async () => {
    const res = await request(app).post('/api/mesas/2/estado').send({ estado: 'cuenta-pedida' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 cuando falta el campo estado', async () => {
    const res = await request(app).post('/api/mesas/2/estado').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400 cuando el estado no es uno reconocido', async () => {
    const res = await request(app).post('/api/mesas/2/estado').send({ estado: 'volando' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('404 cuando la mesa no existe', async () => {
    const res = await request(app).post('/api/mesas/999/estado').send({ estado: 'ocupada' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
