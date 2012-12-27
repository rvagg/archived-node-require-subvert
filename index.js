var _path = require('path')

function RequireSubvert (dir) {
  if (!(this instanceof RequireSubvert)) return new RequireSubvert(dir)
  this._dir = dir
  this._replacements = []
  this._requires = []
}

RequireSubvert.prototype.subvert = function(name, replacement) {
  name = this._fix(name)
  require(name)

  var path     = require.resolve(name)
    , original = require.cache[path]

  if (!original) throw new Error('No such module: ' + name)
  original = original.exports
  require.cache[path].exports = replacement
  this._replacements.push({
      path     : path
    , original : original
  })
}

RequireSubvert.prototype.require = function(name) {
  name = this._fix(name)
  var path = require.resolve(name)
  this._requires.push(path)
  ;delete require.cache[path]
  return require(name)
}

RequireSubvert.prototype.cleanUp = function() {
  this._replacements.forEach(function (replacement) {
    require.cache[replacement.path].exports = replacement.original
  })
  this._replacements = []
  this._requires.forEach(function (path) {
    delete require.cache[path]
  })
  this._requires = []
}

RequireSubvert.prototype._fix = function(name) {
  if (/^[\/\.]/.test(name))
    return _path.join(this._dir, name)
  return name
}

module.exports = RequireSubvert