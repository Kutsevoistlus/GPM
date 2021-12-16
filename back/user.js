let express = require('express'),
    router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");

let users = {}
let tokens = {}

const emailFormat = new RegExp(/^[\w.+]+@[\w]+\.[\w]{2,}$/i);
const passwordFormat = new RegExp(/^[\w!@#.,]+$/i)

function registerAccount(email, pass) {
    users[email] = {
        registered: new Date(),
        lastNotified: new Date(0),
        prefs: {blockedTimes: {}},
        password: bcrypt.hashSync(pass, 10)
    }
    tokens[email] = [];
}

function generateToken() {
    return crypto.randomBytes(20).toString("hex");
}

router.post("/register", function(req, res) {
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

router.post("/login", function(req, res) {
    if(Object.keys(users).indexOf(req.body.email)===-1) {
        return res.send("No such user").status(400);
    }
    if(bcrypt.compareSync(req.body.password, users[req.body.email].password)) {
        tokens[req.body.email].push({string: generateToken(), timeCreated: new Date(), expiryTime: 3600 * 1000});
        console.log(tokens);
        return res.send("Logged in successfully").status(200);
    } else {
        return res.send("Incorrect password").status(400);
    }
})

module.exports = router;