// Each of these is a string that will be require()'d in the couchapp

exports.deep =
  [ "exports.ignoringDeepEquals = ignoringDeepEquals"
  , "exports.extend = deepExtend"
  , function deepExtend(o1, o2) {
    // extend o1 with o2 (in-place)
      for (var prop in o2)
        if (o2.hasOwnProperty(prop))
          if (o1.hasOwnProperty(prop)) {
            if (typeof o1[prop] === "object")
              deepExtend(o1[prop], o2[prop])
          } else
            o1[prop] = o2[prop]
      return o1
    }
  , function fullPath(p){
      return pathPrefix.concat([p])
    }
  , function isObject(v){
      return typeof v === 'object'
    }
  , function arrayInArray(v, arr) {
    // Check whether `arr` contains an array that's shallowly equal to `v`.
      return arr.some(function(e) {
        if (e.length !== v.length) return false
        for (var i=0; i<e.length; i++)
          if (e[i] !== v[i])
            return false
        return true
      })
    }
  , function ignoringDeepEquals(o1, o2, ignoreKeys, pathPrefix){
      pathPrefix = pathPrefix || []
      if (typeof o1 !== typeof o2) {
        return false
      } else if (!isObject(o1)) {
        return o1 === o2
      }
      for (var prop in o1) {
        if (o1.hasOwnProperty(prop) &&
            !arrayInArray(fullPath(prop), ignoreKeys)) {
          if (!o2.hasOwnProperty(prop) ||
              !ignoringDeepEquals(o1[prop], o2[prop], ignoreKeys, fullPath(prop))) {
            return false
          }
        }
      }
      for (var prop in o2) {
        if (o2.hasOwnProperty(prop) &&
            !o1.hasOwnProperty(prop) && !arrayInArray(fullPath(prop), ignoreKeys)) {
          return false
        }
      }
      return true
    }
  ].map(function (s) { return s.toString() }).join("\n")

exports.semver =
  [ 'var expr = exports.expression = '
    + require("semver").expressions.parse.toString()
  , 'exports.valid = valid'
  , 'exports.clean = clean'
  , function valid (v) { return v && typeof v === "string" && v.match(expr) }
  , function clean (v) {
      v = valid(v)
      if (!v) return v
      return [v[1]||'0', v[2]||'0', v[3]||'0'].join('.') + (v[4]||'') + (v[5]||'')
    }
  ].map(function (s) { return s.toString() }).join("\n")

exports.valid =
  [ 'var semver = require("semver")'
  , 'exports.name = validName'
  , 'exports.package = validPackage'
  , function validName (name) {
     if (!name) return false
     var n = name.replace(/^\\s|\\s$/, "")
     if (!n || n.charAt(0) === "."
         || n.match(/[\\/\\(\\)&\\?#\\|<>@:%\\s\\\\]/)
         || n.toLowerCase() === "node_modules"
         || n.toLowerCase() === "favicon.ico") {
       return false
     }
     return n
    }
  , function validPackage (pkg) {
      return validName(pkg.name) && semver.valid(pkg.version)
    }
  ].map(function (s) { return s.toString() }).join("\n")


// monkey patchers
exports.Date =
  [ "exports.parse = parse"
  , "exports.toISOString = toISOString"
  , "exports.now = now"
  , function now () {
      return new Date().getTime()
    }
  , function parse (s) {
      // s is something like "2010-12-29T07:31:06Z"
      s = s.split("T")
      var ds = s[0]
        , ts = s[1]
        , d = new Date()
      ds = ds.split("-")
      ts = ts.split(":")
      var tz = ts[2].substr(2)
      ts[2] = ts[2].substr(0, 2)
      d.setUTCFullYear(+ds[0])
      d.setUTCMonth(+ds[1]-1)
      d.setUTCDate(+ds[2])
      d.setUTCHours(+ts[0])
      d.setUTCMinutes(+ts[1])
      d.setUTCSeconds(+ts[2])
      d.setUTCMilliseconds(0)
      return d.getTime()
    }
  , "exports.toISOString = toISOString"
  , function toISOString () { return ISODateString(this) }
  , function pad(n){return n<10 ? '0'+n : n}
  , function ISODateString(d){
      return d.getUTCFullYear()+'-'
           + pad(d.getUTCMonth()+1)+'-'
           + pad(d.getUTCDate())+'T'
           + pad(d.getUTCHours())+':'
           + pad(d.getUTCMinutes())+':'
           + pad(d.getUTCSeconds())+'Z'}
  ].map(function (s) { return s.toString() }).join("\n")

exports.Object =
  [ "exports.keys = keys"
  , function keys (o) {
      var a = []
      for (var i in o) a.push(i)
      return a }
  ].map(function (s) { return s.toString() }).join("\n")

exports.Array =
  [ "exports.isArray = isArray"
  , function isArray (a) {
      return a instanceof Array
        || Object.prototype.toString.call(a) === "[object Array]"
        || (typeof a === "object" && typeof a.length === "number") }
  ].map(function (s) { return s.toString() }).join("\n")

exports.String =
  [ "exports.trim = trim"
  , function trim () {
      return this.replace(/^\s+|\s+$/g, "")
    }
  ].map(function (s) { return s.toString() }).join("\n")

exports.monkeypatch =
  [ "exports.patch = patch"
  , function patch (Date, Object, Array, String) {
      if (!Date.prototype.toISOString) {
        Date.prototype.toISOString = require("Date").toISOString
      }
      if (!Date.parse || isNaN(Date.parse("2010-12-29T07:31:06Z"))) {
        Date.parse = require("Date").parse
      }
      if (!Date.now) Date.now = require("Date").now
      Object.keys = Object.keys || require("Object").keys
      Array.isArray = Array.isArray || require("Array").isArray
      String.prototype.trim = String.prototype.trim || require("String").trim
    }
  ].map(function (s) { return s.toString() }).join("\n")

