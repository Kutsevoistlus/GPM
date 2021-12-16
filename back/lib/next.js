
const model = require("litejs/model")


global.api = model.List.origin.extend({
	init: function(name, noLoad) {
		var list = this
		, match = name.match(/\?[^\/]*$/)
		, sep = match && match.index

		if (sep) {
			list.filterFn = Fn("i->(i=i.data)&&" + qsToJs(name.slice(sep + 1)))
			list.merge(api(name.slice(0, sep)))
		} else if (name.split("/").pop() == "all") {
			list.merge(api(name.slice(0, -3) + "devices"))
			list.merge(api(name.slice(0, -3) + "rooms"))
			list.merge(api(name.slice(0, -3) + "users"))
			list.merge(api(name.slice(0, -3) + "rules"))
			list.merge(api(name.slice(0, -3) + "securityAreas"))
		} else if (!noLoad) {
			list.load()
		}
	},
	load: function () {
		var list = this
		, resume = list.wait()
		xhr.get("/" + list.name, function(err, res) {
			if (res) {
				res.each(list.add, list)
			}
			resume()
		})
	},
	sortFn: function(a, b) {
		return a.sortKey < b.sortKey ? -1 : 1
	},
	toString: function() {
		return "List[" + this.name + "]"
	}
}).cache(true, function(name) {
	return (name||"")
}, {})

api.prototype.item = model.Item.origin.extend({
	init: function() {
	},
	set: function(key, val) {
		var item = this
		, changed = Item.prototype.set.call(item, key, val)

		item.sortKey = (item.get("name", "").toLowerCase() + " " + item.get("id"))
		.replace(/\d+/g, function(_) {
			return ("000000000" + _).slice(-10)
		})

		return changed
	},
	confirmDrop: function(text, next) {
		if (typeof text == "function") {
			next = text
			text = ""
		}
		var item = this
		Mediator.emit("confirm", function(confirmed) {
			if (confirmed) {
				item.drop(typeof next == "function" && next)
				Mediator.emit("up")
			}
		}, text || "Delete?")
	},
	rel: function(name, next) {
		var site = this
		return api("sites?id=" + site.get("id") + "/" + name)
	},
	drop: function(next) {
		var item = this
		xhr.del(item.lists[0].name.replace(/\?[^\/]*$/, "") + "?id=" + item.data.id, next)
	},
	getInfo: function() {
		var item = this
		, text = item.data.status && JSON.stringify(item.data.status).replace(/,/g,", ").replace(/"/g, "").slice(1, -1)
		return text || ""
	},
	patch: function(data, next) {
		var item = this
		xhr.patch(item.lists[0].name + "?id=" + item.data.id, data, next)
	},
	toString: function() {
		return "Item[" + this.data.id + "]"
	}
}).cache(true, function(a){return a.id}, api.items = {})
