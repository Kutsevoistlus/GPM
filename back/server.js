const express = require('express');
const app = express();
app.use(express.json());

require('dotenv').config();

const axios = require('axios');
const bcrypt = require('bcrypt');

function getToday() {
    let today = new Date();
    today.setHours(0,0,0,0);
    return today;
}

function addDay(givenDay, amount) {
    let newDay = new Date(givenDay);
    newDay.setDate(newDay.getDate() + amount);
    return newDay;
}

 function getPrices() {
    let array = [];
    let currentDate = getToday();
    let nextDate = addDay(currentDate, 1);
    axios.get("https://dashboard.elering.ee/api/nps/price?start="+currentDate.toISOString()+"&end="+nextDate.toISOString())
        .then(function(res) {
            let resData = (res.data.data['ee']); // Select estonia price data
            resData.forEach(function(e) {array.push(e['price'])});
        })
        .catch(err => function(){console.log(err); return []})
    console.log("Retrieved price data");
    return array;
}

let prices = getPrices();
let pricesDate = getToday();

setInterval(function(){
    if(pricesDate.toISOString() !== getToday().toISOString() || !prices.length>0) { // If date changed or price data is empty
        prices = getPrices();
    }
},3000)

let users = {}
const emailFormat = new RegExp(/^[\w.+]+@[\w]+\.[\w]{2,}$/i);
const passwordFormat = new RegExp(/^[\w!@#.,]+$/i)

function registerAccount(email, pass) {
    users[email] = {
        registered: new Date(),
        lastNotified: new Date(0),
        prefs: {blockedTimes: {}},
        password: bcrypt.hashSync(pass, 10)
    }
}

app.post("/register", function(req, res) {
    if(Object.keys(users).indexOf(req.body.email)!==-1) {
        return res.send("Email already registered").status(400);
    }
    if(emailFormat.test(req.body.email) && passwordFormat.test(req.body.password)) {
        registerAccount(req.body.email, req.body.password)
        return res.send("Registered successfully").status(200);
    } else {
        return res.send("Invalid email or password").status(400);
    }
})

app.listen(process.env.PORT, () => {
    console.log("Listening on port "+process.env.PORT);
})