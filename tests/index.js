var assert         = require('assert')
  , RequireSubvert = require('../')

  , requireSubvert = RequireSubvert(__dirname)
  , faker = {}

requireSubvert.subvert('../', faker)
assert(require('../') === faker)
requireSubvert.cleanUp()
assert(require('../') === RequireSubvert)

var mod1 = require('./mod1')
  , mod2 = require('./mod2')
  , mod3 = require('./mod3')

requireSubvert.subvert('./mod2', faker)

assert(requireSubvert.require('./mod1').id === mod1.id)
assert(requireSubvert.require('./mod1').mod2 === faker)
assert(requireSubvert.require('./mod1').mod3 === mod3)

requireSubvert.cleanUp()
