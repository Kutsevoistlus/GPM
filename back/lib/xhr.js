
const http = require("http")
const url = require("url")
const crypto = require("crypto")


function makeReq(method, url, data, next) {
	const reqOpts = url.parse(urlStr)
	reqOpts.method = method
	reqOpts.rejectUnauthorized = false
	reqOpts.headers = {
		//"Cookie": cookie,
		"Content-Type": "application/json"
	}
	if (auth) {
		reqOpts.headers.Authorization = auth
	}
	const req = http.request(reqOpts, handleResponse)

	req.on("error", next)
	if (data) {
		req.write(JSON.stringify(data))
	}
	req.end()

	function handleResponse(res) {
		const code = res.status
		const err = (code < 200 || code > 299 && code != 304) && code
		let body = ""

		res.on("data", chunk => body += chunk)
		res.on("end", () => {
			if (res.headers["content-type"] === "application/json") try {
				body = JSON.parse(body)
			} catch(e) {
				err = e
			}
			next(err, body)
		})
	}

	return req
}


exports.get = function(url, next) {
	return makeReq("GET", url, null, next)
}

exports.del = function(url, next) {
	return makeReq("DELETE", url, null, next)
}

exports.post = function(url, data, next) {
	return makeReq("POST", url, data, next)
}

exports.put = function(url, data, next) {
	return makeReq("PUT", url, data, next)
}

exports.patch = function(url, data, next) {
	return makeReq("PATCH", url, data, next)
}


