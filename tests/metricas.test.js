const request = require('supertest');
const app = require('../src/app');
const { seed } = require('../src/data/store');

beforeEach(() => {
  seed();
});

describe('GET /api/metricas', () => {
  it('refleja el estado sembrado', async () => {
    const res = await request(app).get('/api/metricas');
    expect(res.status).toBe(200);

    // El seed deja 9 mesas en estado "ocupada" (las de cuenta-pedida no cuentan).
    expect(res.body.mesasOcupadas).toBe(9);

    // Nada esta cerrado todavia: no hay facturado ni ticket promedio.
    expect(res.body.facturadoDelDia).toBe(0);
    expect(res.body.ticketPromedio).toBe(0);

    // Pedidos por sector (abiertos+cerrados) / mesas del sector.
    expect(res.body.rotacionPorSector.salon).toBeCloseTo(5 / 12);
    expect(res.body.rotacionPorSector.patio).toBeCloseTo(4 / 8);
    expect(res.body.rotacionPorSector.barra).toBeCloseTo(2 / 4);
  });

  it('actualiza mesasOcupadas y rotacion al abrir un pedido nuevo', async () => {
    // Mesa 2 esta libre en el seed, esta en el sector salon.
    const antes = await request(app).get('/api/metricas');

    const apertura = await request(app)
      .post('/api/pedidos')
      .send({ mesaNumero: 2, items: [{ nombre: 'Agua mineral', cantidad: 1 }] });
    expect(apertura.status).toBe(201);

    const despues = await request(app).get('/api/metricas');
    expect(despues.body.mesasOcupadas).toBe(antes.body.mesasOcupadas + 1);
    expect(despues.body.rotacionPorSector.salon).toBeCloseTo(6 / 12);
    // Cerrar un pedido nuevo todavia no afecta la facturacion.
    expect(despues.body.facturadoDelDia).toBe(0);
  });

  it('actualiza facturadoDelDia, ticketPromedio y libera la mesa al cerrar un pedido', async () => {
    // El pedido 1 (mesa 1) es el primero que crea el seed.
    const cierre = await request(app).post('/api/pedidos/1/cerrar');
    expect(cierre.status).toBe(200);
    const totalCerrado = cierre.body.total;

    const res = await request(app).get('/api/metricas');
    expect(res.body.facturadoDelDia).toBe(totalCerrado);
    expect(res.body.ticketPromedio).toBe(totalCerrado);
    // La mesa 1 no tenia otros pedidos abiertos: pasa a libre y deja de contar como ocupada.
    expect(res.body.mesasOcupadas).toBe(8);
    // La rotacion no cambia: el pedido cerrado se sigue contando en el sector.
    expect(res.body.rotacionPorSector.salon).toBeCloseTo(5 / 12);
  });

  it('promedia el ticket cuando se cierran varios pedidos', async () => {
    const primero = await request(app).post('/api/pedidos/1/cerrar');
    const segundo = await request(app).post('/api/pedidos/3/cerrar');

    const res = await request(app).get('/api/metricas');
    const facturadoEsperado = primero.body.total + segundo.body.total;
    expect(res.body.facturadoDelDia).toBe(facturadoEsperado);
    expect(res.body.ticketPromedio).toBeCloseTo(facturadoEsperado / 2);
  });
});
