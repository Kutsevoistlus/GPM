const express = require('express');
const app = express();
app.use(express.json());

require('dotenv').config();

app.use('/prices', require('./prices.js'));
app.use('/user', require('./user.js'));

app.listen(process.env.PORT, () => {
    console.log("Listening on port "+process.env.PORT);
})