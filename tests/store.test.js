const { mesas, pedidos, seed, ESTADOS_MESA } = require('../src/data/store');

describe('modelo de datos en memoria', () => {
  beforeEach(() => {
    seed();
  });

  it('tiene 24 mesas', () => {
    expect(mesas).toHaveLength(24);
  });

  it('cada mesa tiene un estado valido', () => {
    const estadosValidos = Object.values(ESTADOS_MESA);
    mesas.forEach((mesa) => {
      expect(estadosValidos).toContain(mesa.estado);
    });
  });

  it('genera pedidos con items y total calculado', () => {
    expect(pedidos.length).toBeGreaterThan(0);
    // Hay de los DOS tipos: abiertos (las mesas que estan comiendo) y cerrados
    // (lo que ya se cobro esta noche). Sin cerrados, el facturado y el ticket
    // promedio arrancan en cero y el panel no dice nada util.
    expect(pedidos.some((p) => p.abierto)).toBe(true);
    expect(pedidos.some((p) => !p.abierto)).toBe(true);

    pedidos.forEach((pedido) => {
      expect(pedido.items.length).toBeGreaterThan(0);
      const totalEsperado = pedido.items.reduce(
        (acc, item) => acc + item.precio * item.cantidad,
        0
      );
      expect(pedido.total).toBe(totalEsperado);
    });
  });
});
