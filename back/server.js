const express = require('express');
const app = express();
app.use(express.json());

require('dotenv').config();

require('./prices.js');
app.use('/register', require('./register.js'));

app.listen(process.env.PORT, () => {
    console.log("Listening on port "+process.env.PORT);
})