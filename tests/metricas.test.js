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

    // El seed cierra 6 pedidos: la noche ya empezo y el panel tiene que
    // mostrarlo. Un ticket promedio en cero al abrir el panel no le sirve a
    // nadie, aunque el calculo sea correcto.
    expect(res.body.facturadoDelDia).toBeGreaterThan(0);
    expect(res.body.ticketPromedio).toBeGreaterThan(0);
    // Y el promedio es el facturado dividido los 6 cerrados.
    expect(res.body.ticketPromedio).toBeCloseTo(res.body.facturadoDelDia / 6);

    // Pedidos por sector (abiertos+cerrados) / mesas del sector. Ahora hay 6
    // cerrados mas: 4 en salon (mesas 2, 4, 6, 12), 1 en patio (15) y 1 en
    // barra (21).
    expect(res.body.rotacionPorSector.salon).toBeCloseTo(9 / 12);
    expect(res.body.rotacionPorSector.patio).toBeCloseTo(5 / 8);
    expect(res.body.rotacionPorSector.barra).toBeCloseTo(3 / 4);
  });

  it('actualiza mesasOcupadas y rotacion al abrir un pedido nuevo', async () => {
    // Mesa 8: libre en el seed y sin pedidos previos, en el sector salon.
    const antes = await request(app).get('/api/metricas');

    const apertura = await request(app)
      .post('/api/pedidos')
      .send({ mesaNumero: 8, items: [{ nombre: 'Agua mineral', cantidad: 1 }] });
    expect(apertura.status).toBe(201);

    const despues = await request(app).get('/api/metricas');
    expect(despues.body.mesasOcupadas).toBe(antes.body.mesasOcupadas + 1);
    expect(despues.body.rotacionPorSector.salon).toBeCloseTo(10 / 12);
    // Abrir un pedido no factura nada: lo facturado es lo COBRADO.
    expect(despues.body.facturadoDelDia).toBe(antes.body.facturadoDelDia);
  });

  it('actualiza facturadoDelDia, ticketPromedio y libera la mesa al cerrar un pedido', async () => {
    // El pedido 1 (mesa 1) es el primero que crea el seed.
    const cierre = await request(app).post('/api/pedidos/1/cerrar');
    expect(cierre.status).toBe(200);
    const totalCerrado = cierre.body.total;

    const antes = 6; // los que ya cierra el seed
    const res = await request(app).get('/api/metricas');
    // Lo que ya habia MAS lo que se acaba de cobrar.
    expect(res.body.facturadoDelDia).toBeGreaterThan(totalCerrado);
    expect(res.body.ticketPromedio).toBeCloseTo(res.body.facturadoDelDia / (antes + 1));
    // La mesa 1 no tenia otros pedidos abiertos: pasa a libre y deja de contar como ocupada.
    expect(res.body.mesasOcupadas).toBe(8);
    // La rotacion no cambia: el pedido cerrado se sigue contando en el sector.
    expect(res.body.rotacionPorSector.salon).toBeCloseTo(9 / 12);
  });

  it('promedia el ticket cuando se cierran varios pedidos', async () => {
    const primero = await request(app).post('/api/pedidos/1/cerrar');
    const segundo = await request(app).post('/api/pedidos/3/cerrar');

    const res = await request(app).get('/api/metricas');
    // Los 6 del seed mas estos dos: el promedio es sobre los 8.
    const sumaDeLosDos = primero.body.total + segundo.body.total;
    expect(res.body.facturadoDelDia).toBeGreaterThan(sumaDeLosDos);
    expect(res.body.ticketPromedio).toBeCloseTo(res.body.facturadoDelDia / 8);
  });
});
