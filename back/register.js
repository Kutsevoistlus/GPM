let express = require('express'),
    router = express.Router();
const bcrypt = require("bcrypt");

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

router.post("/", function(req, res) {
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

module.exports = router;