let express = require('express'),
    router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

let users = {}
let tokens = {}

const emailFormat = new RegExp(/^[\w.+]+@[\w]+\.[\w]{2,}$/i);
const passwordFormat = new RegExp(/^[\w!@#.,]+$/i)

function registerAccount(email, pass) {
    users[email] = {
        registered: new Date(),
        lastNotified: new Date(0),
        prefs: {blockedTimes: []},
        password: bcrypt.hashSync(pass, 10)
    }
    tokens[email] = [];
}

function generateToken() {
    return crypto.randomBytes(20).toString("hex");
}

function sendEmail(email, type) {
    const emailText = 'Hei, elektri hind on tõuseb järgmise tunni jooksul 70% ja püsib kuni kella 19:00-ni.'
    const msg = {
        to: email,
        from: 'goombapowermanagement@gmail.com',
        subject: 'Elektri hindade muutus',
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

setInterval(function(){
    let currentHour = new Date().getHours()
    for(let i in users) {
        if(users[i].lastNotified.getHours() < currentHour && users[i].prefs.blockedTimes.indexOf(currentHour) === -1) {
            //sendEmail(i);
            console.log("Sent email");
            users[i].lastNotified = new Date();
        }
    }
},3000)

module.exports = router;