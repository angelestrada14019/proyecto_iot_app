//requires
// express para crear el servidor
const express = require('express');
// morgan para ver las peticiones cuando se usa el endpoint
const morgan = require('morgan');
//cors para permitir peticiones desde otros dominios
const cors = require('cors');
//mongoose para conectar con la base de datos
const mongoose = require('mongoose');
// colors para imprimir en consola con colores
const colors = require('colors');

//instances
const app = express();
// express config
app.use(morgan('tiny')); //dar mas detalles a las peticiones con tiny
app.use(express.json()); //para que el servidor entienda json
app.use(express.urlencoded({ extended: true })); //para que el servidor entienda parametros por url
app.use(cors()); //permitir peticiones desde otros dominios

//routes
app.use('/v1', require('./routes/devices.js'));
app.use('/v1', require('./routes/users.js'));


module.exports = app; //exportar el servidor y poder usarlo en otros archivos

//listener
app.listen(3001, () => {
    console.log('Server running on port 3001');
});

//endpoint test req: todos los datos entrantes, res: respuesta a la peticion del cliente
// app.get('/testing', (req, res) => {
//   res.send('Hello World');
// });

//mongo connection
const mongoUserName = 'root';
const mongoPassword = '02102910';
const mongoHost = 'localhost';
const mongoPort = "27018";
const mongoDBName = 'api-iot';
const mongoURL = `mongodb://${mongoUserName}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`;
const mongoOptions = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    authSource: "admin"
};
mongoose.connect(mongoURL, mongoOptions).then(() => {
    console.log('MongoDB connected'.green);
}).catch(err => {
    console.log('MongoDB connection error index line 53'.red);
    console.log(err);
});
