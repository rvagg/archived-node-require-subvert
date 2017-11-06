var _path = require('path')
var _fs = require('fs')

function RequireSubvert (dir) {
  if (!(this instanceof RequireSubvert)) return new RequireSubvert(dir)
  this._dir = dir
  this._replacements = []
  this._requires = []
}

RequireSubvert.prototype.subvert = function(name, replacement) {
  name = this._fix(name)

  var path     = require.resolve(name)
    , original = require.cache[path]

  if (original){
    original = original.exports
  } 
  else {
    if(!_fs.existsSync(path)) {
      throw new Error('No such module: ' + name)
    }

    // this seems to work just fine for plain old require, however 
    // if other things are accessed off cache it will be a problem
    require.cache[path] = {} 
  }

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
  // if we don't do it backwards, modules that have been subverted multiple
  // times will not get their originals properly.
  this._replacements.reverse()
  this._replacements.forEach(function (replacement) {
    if(replacement.original){
      require.cache[replacement.path].exports = replacement.original
    }
    else{
      delete require.cache[replacement.path]
    }
  })
  this._replacements = []
  this._requires.forEach(function (path) {
    delete require.cache[path]
  })
  this._requires = []
}

RequireSubvert.prototype._fix = function(name) {
  if (/^\./.test(name))
    return _path.join(this._dir, name)
  return name
}

module.exports = RequireSubvert
