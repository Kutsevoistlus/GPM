let express = require('express'),
    router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

let users = {}

const emailFormat = new RegExp(/^[\w.+]+@[\w]+\.[\w]{2,}$/i);
const passwordFormat = new RegExp(/^[\w!@#.,]+$/i)

function registerAccount(email, pass, agatarkId) {
    users[email] = {
        registered: new Date(),
        lastNotified: new Date(0),
        prefs: {
            silentTime: [],
            autoPower: false,
            autoPoweredDevices: [],
            minPower: 50,
            maxPower: 100
        },
        password: bcrypt.hashSync(pass, 10),
        agatarkId: agatarkId || -1,
        tokens: []
    }
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

function checkToken(string) {
    let now = new Date();
    for(let i in users) {
        for(let j in users[i].tokens) {
            let checking = users[i].tokens[j];
            if(string === checking.string) {
                if(now > (Date.parse(checking.timeCreated) + checking.expiryTime)) {
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
        let token = generateToken();
        users[req.body.email].tokens.push({string: token, timeCreated: new Date(), expiryTime: 600 * 1000});
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
    console.log(users[user].prefs);
    return res.send("Successfully updated settings").status(200);
})

setInterval(function(){
    let currentHour = new Date().getHours();
    for(let i in users) {
        if(users[i].lastNotified.getHours() < currentHour && users[i].prefs.silentTime.indexOf(currentHour) === -1) {
            //sendEmail(i);
            console.log("Sent email");
            users[i].lastNotified = new Date();
        }
    }
},3000)

module.exports = router;