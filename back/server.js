const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());

require('dotenv').config();

app.use('/', express.static("./front"));
app.use('/prices', require('./prices.js'));
app.use('/user', require('./user.js'));

app.listen(process.env.PORT, () => {
    console.log("Listening on port "+process.env.PORT);
})