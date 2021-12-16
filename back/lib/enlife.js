
exports.Api = Api


const http = require("http")
const https = require("https")
const url = require("url")
const crypto = require("crypto")
var auth


function Api(url) {
	this.seq = 0
	this.url = url
}

Api.prototype = {
	get: function(path) {
		return makeRequest("GET", this.url + path)
	},
	post: function(path, params) {
		return makeRequest("POST", this.url + path, params)
	},
	put: function(path, params) {
		return makeRequest("PUT", this.url + path, params)
	},
	patch: function(path, params) {
		return makeRequest("PATCH", this.url + path, params)
	},
	delete: function(path) {
		console.log('DELETE ',path)
		return makeRequest("DELETE", this.url + path)
	},
	login: function(user, pass) {
		const key = crypto.pbkdf2Sync(pass, user, 10000, 32, "sha256")
		return this
		.put("/hello", { user: user, token: key.toString("hex") })
		.then(res => {
			auth = res.authorization
			if (!auth) throw new Error("no auth")
		})
		.then(() => this)
	},
	wizard: function() {
		return this
		.post("/hello", {"type":"standalone","site":{"name":"C100"},"user":{"name":"EnLife Support","nick":"EnLife","email":"support@enlife.io"},"auth":{"pass":""}})
		.then(res => {
			auth = res.authorization
			if (!auth) throw new Error("no auth")
		})
		.then(() => this)
	}
}

function makeRequest(method, urlStr, data) {
	return new Promise((resolve, reject) => {
		const reqOpts = url.parse(urlStr)
		reqOpts.family = 4
		reqOpts.method = method
		reqOpts.rejectUnauthorized = false
		reqOpts.headers = {
			//"Cookie": cookie,
			"Accept-Confirm": "ok",
			"Content-Type": "application/json"
		}
		if (auth) {
			reqOpts.headers.Authorization = auth
		}
		const req = (reqOpts.protocol == "http:" ? http : https).request(reqOpts, handleResponse)

		req.on("error", reject)
		if (data) {
			console.log("NEW ", method, " ==>", urlStr, " ==> ", JSON.stringify(data))
			req.write(JSON.stringify(data))
		}
		req.end()

		function handleResponse(res) {
			var body = ""

			res.on("data", chunk => body += chunk)
			res.on("end", () => {
				if (res.statusCode >= 400) {
					return reject(`${method} to ${res.url} failed with HTTP ${res.statusCode}\n${body}`)
				}

				try {
					if (res.statusCode == 201) {
						resolve({
							url: res.headers["location"],
							id: +res.headers["location"].split("=").pop()
						})
					} else {
						resolve(res.headers["content-type"] === "application/json" ? JSON.parse(body) : body)
					}
				} catch(e) {
					reject(e)
				}
			})
		}
	})
}

