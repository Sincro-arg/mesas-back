// Modelo de datos en memoria: mesas, pedidos y estados.
// Los endpoints consumen las funciones exportadas de aca, nunca deberian
// reasignar los arrays directamente (usar los metodos que mutan en su lugar).

const ESTADOS_MESA = {
  LIBRE: 'libre',
  OCUPADA: 'ocupada',
  RESERVADA: 'reservada',
  CUENTA_PEDIDA: 'cuenta-pedida',
};

const SECTORES = {
  SALON: 'salon',
  PATIO: 'patio',
  BARRA: 'barra',
};

// Transiciones de estado que tienen sentido para una mesa de salon.
// Ej: no se puede pedir la cuenta de una mesa libre, ni reservar una que
// ya esta ocupada.
const TRANSICIONES_VALIDAS = {
  [ESTADOS_MESA.LIBRE]: [ESTADOS_MESA.OCUPADA, ESTADOS_MESA.RESERVADA],
  [ESTADOS_MESA.RESERVADA]: [ESTADOS_MESA.OCUPADA, ESTADOS_MESA.LIBRE],
  [ESTADOS_MESA.OCUPADA]: [ESTADOS_MESA.CUENTA_PEDIDA, ESTADOS_MESA.LIBRE],
  [ESTADOS_MESA.CUENTA_PEDIDA]: [ESTADOS_MESA.LIBRE, ESTADOS_MESA.OCUPADA],
};

// Menu base usado para generar los pedidos de ejemplo en el seed.
const MENU = [
  { nombre: 'Milanesa con papas fritas', precio: 8500 },
  { nombre: 'Empanada de carne', precio: 900 },
  { nombre: 'Pizza muzzarella', precio: 7200 },
  { nombre: 'Ensalada mixta', precio: 3200 },
  { nombre: 'Cerveza artesanal', precio: 2800 },
  { nombre: 'Agua mineral', precio: 1200 },
  { nombre: 'Bife de chorizo', precio: 12000 },
  { nombre: 'Pastas caseras', precio: 6800 },
  { nombre: 'Copa de vino', precio: 2500 },
  { nombre: 'Flan casero', precio: 2200 },
];

function itemMenu(nombre) {
  const item = MENU.find((m) => m.nombre === nombre);
  if (!item) {
    throw new Error(`Item de menu inexistente: ${nombre}`);
  }
  return item;
}

// 24 mesas realistas distribuidas en tres sectores.
function mesasIniciales() {
  return [
    // Salon (12 mesas)
    { numero: 1, capacidad: 2, sector: SECTORES.SALON },
    { numero: 2, capacidad: 2, sector: SECTORES.SALON },
    { numero: 3, capacidad: 4, sector: SECTORES.SALON },
    { numero: 4, capacidad: 4, sector: SECTORES.SALON },
    { numero: 5, capacidad: 4, sector: SECTORES.SALON },
    { numero: 6, capacidad: 4, sector: SECTORES.SALON },
    { numero: 7, capacidad: 6, sector: SECTORES.SALON },
    { numero: 8, capacidad: 6, sector: SECTORES.SALON },
    { numero: 9, capacidad: 2, sector: SECTORES.SALON },
    { numero: 10, capacidad: 4, sector: SECTORES.SALON },
    { numero: 11, capacidad: 4, sector: SECTORES.SALON },
    { numero: 12, capacidad: 8, sector: SECTORES.SALON },
    // Patio (8 mesas)
    { numero: 13, capacidad: 4, sector: SECTORES.PATIO },
    { numero: 14, capacidad: 4, sector: SECTORES.PATIO },
    { numero: 15, capacidad: 2, sector: SECTORES.PATIO },
    { numero: 16, capacidad: 2, sector: SECTORES.PATIO },
    { numero: 17, capacidad: 6, sector: SECTORES.PATIO },
    { numero: 18, capacidad: 4, sector: SECTORES.PATIO },
    { numero: 19, capacidad: 2, sector: SECTORES.PATIO },
    { numero: 20, capacidad: 4, sector: SECTORES.PATIO },
    // Barra (4 mesas)
    { numero: 21, capacidad: 2, sector: SECTORES.BARRA },
    { numero: 22, capacidad: 2, sector: SECTORES.BARRA },
    { numero: 23, capacidad: 2, sector: SECTORES.BARRA },
    { numero: 24, capacidad: 2, sector: SECTORES.BARRA },
  ].map((mesa) => ({ ...mesa, estado: ESTADOS_MESA.LIBRE }));
}

const mesas = mesasIniciales();
const pedidos = [];
let siguientePedidoId = 1;

function buscarMesa(numero) {
  return mesas.find((m) => m.numero === numero);
}

function pedidosAbiertosDeMesa(numero) {
  return pedidos.filter((p) => p.mesaNumero === numero && p.abierto);
}

function pedidosAbiertos() {
  return pedidos.filter((p) => p.abierto);
}

function buscarPedido(id) {
  return pedidos.find((p) => p.id === id);
}

function crearItemsPedido(especificacion) {
  return especificacion.map(([nombre, cantidad]) => {
    const { precio } = itemMenu(nombre);
    return { nombre, cantidad, precio };
  });
}

function totalPedido(items) {
  return items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
}

function crearPedido(mesaNumero, especificacionItems) {
  const items = crearItemsPedido(especificacionItems);
  const pedido = {
    id: siguientePedidoId++,
    mesaNumero,
    items,
    total: totalPedido(items),
    abierto: true,
    creadoEn: new Date().toISOString(),
  };
  pedidos.push(pedido);
  return pedido;
}

// Genera mesas ocupadas/reservadas/con cuenta pedida con pedidos abiertos
// distribuidos entre los tres sectores. Se corre una vez al arrancar el
// servidor para tener datos de ejemplo realistas.
function seed() {
  mesas.length = 0;
  mesas.push(...mesasIniciales());
  pedidos.length = 0;
  siguientePedidoId = 1;

  const ocupadas = [
    [1, [['Milanesa con papas fritas', 1], ['Cerveza artesanal', 2]]],
    [3, [['Pizza muzzarella', 1], ['Agua mineral', 2]]],
    [5, [['Bife de chorizo', 1], ['Copa de vino', 2], ['Flan casero', 1]]],
    [7, [['Pastas caseras', 2], ['Agua mineral', 1]]],
    [11, [['Empanada de carne', 4], ['Cerveza artesanal', 1]]],
    [14, [['Ensalada mixta', 1], ['Milanesa con papas fritas', 1], ['Agua mineral', 2]]],
    [16, [['Pizza muzzarella', 2], ['Cerveza artesanal', 2]]],
    [20, [['Bife de chorizo', 2], ['Copa de vino', 2]]],
    [22, [['Empanada de carne', 2], ['Cerveza artesanal', 1]]],
  ];

  ocupadas.forEach(([mesaNumero, especificacionItems]) => {
    crearPedido(mesaNumero, especificacionItems);
    buscarMesa(mesaNumero).estado = ESTADOS_MESA.OCUPADA;
  });

  const conCuentaPedida = [
    [18, [['Bife de chorizo', 1], ['Copa de vino', 1]]],
    [24, [['Empanada de carne', 3], ['Agua mineral', 1]]],
  ];

  conCuentaPedida.forEach(([mesaNumero, especificacionItems]) => {
    crearPedido(mesaNumero, especificacionItems);
    buscarMesa(mesaNumero).estado = ESTADOS_MESA.CUENTA_PEDIDA;
  });

  [9, 19].forEach((mesaNumero) => {
    buscarMesa(mesaNumero).estado = ESTADOS_MESA.RESERVADA;
  });

  // Los que YA se cobraron esta noche, y las mesas quedaron libres.
  //
  // Sin esto, `facturadoDelDia` y `ticketPromedio` arrancan en cero. El calculo
  // no esta mal —solo cuenta pedidos cerrados, que es lo correcto: facturado es
  // lo cobrado, no lo que todavia esta en la mesa— pero un panel de sala que
  // muestra el ticket promedio en cero no le sirve a nadie. El encargado quiere
  // ver como viene la noche, y a las nueve ya se cobraron mesas.
  const yaCobrados = [
    [2, [['Pizza muzzarella', 1], ['Cerveza artesanal', 2]]],
    [4, [['Milanesa con papas fritas', 2], ['Agua mineral', 2], ['Flan casero', 2]]],
    [6, [['Empanada de carne', 6], ['Cerveza artesanal', 3]]],
    [12, [['Bife de chorizo', 2], ['Copa de vino', 3], ['Flan casero', 1]]],
    [15, [['Pastas caseras', 1], ['Agua mineral', 1]]],
    [21, [['Ensalada mixta', 2], ['Copa de vino', 1]]],
  ];

  yaCobrados.forEach(([mesaNumero, especificacionItems]) => {
    const pedido = crearPedido(mesaNumero, especificacionItems);
    pedido.abierto = false;
    // La mesa vuelve a LIBRE: se cobro y se fueron. El estado tiene que quedar
    // coherente con el pedido, o el panel muestra una mesa ocupada sin nada.
    buscarMesa(mesaNumero).estado = ESTADOS_MESA.LIBRE;
  });
}

function pedidosCerrados() {
  return pedidos.filter((p) => !p.abierto);
}

function mesasOcupadas() {
  return mesas.filter((m) => m.estado === ESTADOS_MESA.OCUPADA).length;
}

function facturadoDelDia() {
  return pedidosCerrados().reduce((acc, p) => acc + p.total, 0);
}

function ticketPromedio() {
  const cerrados = pedidosCerrados();
  if (cerrados.length === 0) return 0;
  return facturadoDelDia() / cerrados.length;
}

// Pedidos totales (abiertos + cerrados) de las mesas del sector, dividido
// la cantidad de mesas de ese sector: cuantas veces "roto" cada mesa en
// promedio desde el arranque.
function rotacionPorSector() {
  const resultado = {};
  Object.values(SECTORES).forEach((sector) => {
    const numerosDelSector = new Set(
      mesas.filter((m) => m.sector === sector).map((m) => m.numero)
    );
    const cantidadMesas = numerosDelSector.size;
    const pedidosDelSector = pedidos.filter((p) => numerosDelSector.has(p.mesaNumero));
    resultado[sector] = cantidadMesas === 0 ? 0 : pedidosDelSector.length / cantidadMesas;
  });
  return resultado;
}

function metricas() {
  return {
    mesasOcupadas: mesasOcupadas(),
    ticketPromedio: ticketPromedio(),
    facturadoDelDia: facturadoDelDia(),
    rotacionPorSector: rotacionPorSector(),
  };
}

module.exports = {
  ESTADOS_MESA,
  SECTORES,
  TRANSICIONES_VALIDAS,
  MENU,
  mesas,
  pedidos,
  seed,
  buscarMesa,
  buscarPedido,
  pedidosAbiertosDeMesa,
  pedidosAbiertos,
  pedidosCerrados,
  crearPedido,
  metricas,
};
