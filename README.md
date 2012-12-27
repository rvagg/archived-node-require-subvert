# Require Subvert [![Build Status](https://secure.travis-ci.org/rvagg/node-require-subvert.png)](http://travis-ci.org/rvagg/node-require-subvert)

***Yet another `require()` subversion library for mocking & stubbing.***

*[Just show me the API!](#api)*

Require Subvert is a very simple library with a very simple purpose: to subvert `require()` calls for modules that can't be easily mocked or stubbed. Specifically, modules whose export is simply a function.

For the case where a module exports an object that has child-functions, you don't need anything fancy for subverting `require()`. Consider the following code that uses [Sinon](http://sinonjs.org/) for mocking:

```js
var sinon = require('sinon')
  , foo = require('foo')
  , fooMock = sinon.mock(foo)

fooMock.expects('bar').once().withArgs(1, 2).returns(3)

assert(foo.bar() == 3)
fooMock.verify()
```

In this case, Sinon is simply replacing the exported API of `'foo'` with a mock and because `require()` caches modules, the same module instance is shared across any other module requiring `'foo'` in the same Node process (unless they are messing with the require cache). Nothing else needed!

But, if `'foo'` was exported a function, e.g.:

```js
module.exports = function (x, y) { ... }
```

then you'd be in a bit of trouble. Any other module that has already called `require('foo')` will have a reference to the original function and you can't take it back or overwrite it with a mock.

Enter **Require Subvert**. The solution is to replace the `exports` in the require cache and then *reload* any module that requires the module being mocked.

Assume that module `'foo'` exports a function that we want to stub out and we want to test `'bar'` which uses `'foo`' foo internally:

```js
// bar.js
var foo = require('foo')
module.exports.bang = function (x, y) {
  foo(x, y)
}
```

We can then stub `'foo'` for our test of `'bar'`:

```js
var sinon = require('sinon')
  , requireSubvert = require('require-subvert')(__dirname)
  , stub = sinon.stub()
  , bar

// subvert 'foo' with the stub
requireSubvert.subvert('foo', stub)
// (re)load 'bar', this fetches a fresh version of 'bar' after
// clearing it from the cache
bar = requireSubvert.require('bar')

// execute
bar.bang(1, 2)

// verify
assert(stub.callCount == 1)
assert(stub.getCall(0).args[0] == 1)
assert(stub.getCall(0).args[1] == 2)

// undo all our damage
requireSubvert.cleanUp()
```

<a name="api"></a>
## API

### RequireSubvert(__dirname)
You initialize Require Subvert by calling it with `__dirname` so it knows where the current module is located so any relative-path `require()` calls can be rewritten properly.

You can initialize Require Subvert in a few different ways, depending on your needs:

```js
var requireSubvert = require('require-subvert')(__dirname)
// or
var RequireSubvert = require('require-subvert')
var instance = new RequireSubvert(__dirname)
```

Using the `new` operator may be helpful if you needed multiple instances for any reason, but remember that you're always operating on the same require cache no matter how many instances of Require Subvert you create!

### subvert(name, replacement)
`subvert()` is how you provide a mock/stub to be used in place of module `'name'`. The *name* can be whatever you would normally pass to `require()`, so it could be a global module, like `'fs'`, or something you have installed in *node_modules*). Or it could be a relative path (**relative to the current module**, even if you're testing a module in a different directory!), like `'../lib/foo'`.

### require(name)
`require()` is what you should use in place of the global `require()` for any modules *under test*. It simply clears that module from the cache and reloads a fresh version that will use the stub/mock version(s) with its own `require()`.

### cleanUp()
`cleanUp()` should be called after you have finished with your subverted modules. It will restore the original versions in the require cache and also removed from the cache any modules you created with Require Subvert's own `require()` method.

## Licence

Require Subvert is Copyright (c) 2012 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.