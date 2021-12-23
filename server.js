const express = require('express');
const router = require('./routers/router.js');

const PORT = 3000;

const app = express();
app.use(express.json());
app.use('/api', router);


app.listen(PORT, () => console.log("server has been started"));

(async function (){

})()
