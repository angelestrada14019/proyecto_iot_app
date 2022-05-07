//requires
const express = require('express');

//instances
const app = express();


//listener
app.listen(3001, () => {
    console.log('Server running on port 3001');
});

//endpoint test req: todos los datos entrantes, res: respuesta a la peticion del cliente
app.get('/testing', (req, res) => {
    res.send('Hello World');
});
