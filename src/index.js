const app = require('./app');
const { seed } = require('./data/store');

seed();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`mesas-back escuchando en el puerto ${PORT}`);
});
