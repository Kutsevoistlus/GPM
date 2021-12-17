let express = require('express'),
    router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sgMail = require('@sendgrid/mail');
const axios = require("axios");
const {getPrices, getToday} = require("./prices");
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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

function registerAccount(email, pass, agatarkId) {
    users[email] = {
        registered: Date.now(),
        lastNotified: 0,
        password: bcrypt.hashSync(pass, 10),
        tokens: [],
        agatarkId: agatarkId || -1,
        lastPowered: 0,
        devices: [],
        prefs: {
            silentTime: [],
            autoPower: false,
            autoPoweredDevices: [],
            minPower: 50,
            maxPower: 100
        }
    }
    console.log("Registered account");
}

function sendEmail(email) {
    const emailText = 'Tere, täname et registreerisite meie teenusega.'
    const msg = {
        to: email,
        from: 'goombapowermanagement@gmail.com',
        subject: 'Olete registreeritud Goomba Power Management leheküljele',
        text: emailText,
        html: '<p>'+emailText+'</p><br><br>See on automaatselt genereeritud email. Palun ärge vastake sellele.'
    }
    sgMail.send(msg)
        .then(() => {
            console.log('Email sent to '+email)
        }).catch((error) => {
            console.error(error)
        })
    return true;
}

function checkToken(string) {
    let now = Date.now();
    for(let i in users) {
        for(let j in users[i].tokens) {
            let checking = users[i].tokens[j];
            if(string === checking.string) {
                if(now > (checking.timeCreated + checking.expiryTime)) {
                    console.log("Outdated string");
                    users[i].tokens.splice(Number(j), 1);
                    return false;
                }
                console.log("String matched");
                return i;
            }
        }
    }
    console.log("String didn't match");
    return false;
}

router.post("/register", function(req, res) {
    if(Object.keys(users).indexOf(req.body.email)!==-1) {
        return res.send("Email already registered").status(400);
    }
    if(emailFormat.test(req.body.email) && passwordFormat.test(req.body.password)) {
        registerAccount(req.body.email, req.body.password, req.body.agatarkId);
        return res.send("Registered successfully").status(200);
    } else {
        return res.send("Invalid email or password").status(400);
    }
})

router.post("/login", function(req, res) {
    if(Object.keys(users).indexOf(req.body.email)===-1) {
        return res.send("No such user").status(400);
    }
    if(bcrypt.compareSync(req.body.password, users[req.body.email].password)) {
        let token = crypto.randomBytes(20).toString("hex");
        users[req.body.email].tokens.push({string: token, timeCreated: Date.now(), expiryTime: 600 * 1000});
        return res.json({token: token}).status(200);
    } else {
        return res.send("Incorrect password").status(400);
    }
})

router.post("/token", function(req, res) {
    return res.send(checkToken(req.body.token));
})

router.post("/settings", function(req, res) {
    let user = checkToken(req.body.token);
    if(!user) {
        return res.send("Invalid session token").status(400);
    }
    for(let i in req.body.settings) {
        if(users[user].prefs[i] !== undefined) users[user].prefs[i] = req.body.settings[i];
    }
    return res.send("Successfully updated settings").status(200);
})

router.post("/get-settings", function(req, res) {
    let user = checkToken(req.body.token);
    if(!user) {
        return res.send("Invalid session token").status(400);
    }
    return res.send(users[user].prefs).status(200);
})

let loginToken = crypto.pbkdf2Sync("apiUserApiUser", "apiuser", 10000, 32, "sha256").toString("hex");
let config = {headers: {"Accept-Confirm": "ok", "Content-Type": "application/json"}}

axios.put("https://c607.by.enlife.io/hello", {user: "apiuser", token: loginToken})
    .then(function(res) {
        config.headers.Authorization = res.data.authorization;
    })
    .catch(err => function(){console.log(err)})

function getDevices() {
    return Promise.all([
    axios.get("https://c607.by.enlife.io/devices", config)
        .then(function(res){
            return res.data;
        })
        .catch(err => console.log(err))
    ])
}

function getDeviceData(devices) {
    let data = []
    for(let i in devices) {
        const rg = /#[0-9]+:[0-9]+/
        const rg2 = /[0-9]+/g
        let minMax;
        devices[i].id !== 22 ? minMax = devices[i].ui.i2[2].match(rg)[0].match(rg2) : minMax = devices[i].ui.i2[1].match(rg)[0].match(rg2)
        data.push({id: devices[i].id, min: Number(minMax[0]), max: Number(minMax[1])})
        /*
        This takes the minimum and maximum setpoints on the website to determine "reasonable ranges" for devices.
        The api allows practically any input, so this is necessary to avoid making random guesses.
         */
    }
    return data;
}

function alterDevice(id, data) {
    axios.patch("https://c607.by.enlife.io/devices?id="+id, data, config)
        .then(function(){console.log("Changed device id "+id)})
        .catch(err => console.log(err));
}

setInterval(function(){
    let priceLevel = (prices[new Date().getHours()] - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices));
    //console.log("Price level: "+priceLevel);
    for(let i in users) {

        if(users[i].agatarkId!==-1 && users[i].devices.length===0) {
            getDevices().then(function(res){users[i].devices = getDeviceData(res[0])});
        }

        if(users[i].prefs.autoPower && users[i].lastPowered+1800*1e3 < Date.now() && users[i].prefs.autoPoweredDevices.length>0) {
            users[i].devices.forEach(function(device){
                if(users[i].prefs.autoPoweredDevices.indexOf(device.id)!==-1) {
                    let setPoint = device.min + (device.max - device.min) * priceLevel;
                    alterDevice(device.id, {"setpoint": setPoint.toPrecision(4)})
                }
            })
            users[i].lastPowered = Date.now();
        }
    }
    for(let i in users) {
        if(users[i].lastNotified < Date.now() && users[i].prefs.silentTime.indexOf(new Date().getHours()) === -1) {
            sendEmail(i);
            users[i].lastNotified = Date.now()*10; // Never notify again
        }
    }
},3000)

module.exports = router;