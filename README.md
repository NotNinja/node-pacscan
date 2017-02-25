    8888888b.                   .d8888b.
    888   Y88b                 d88P  Y88b
    888    888                 Y88b.
    888   d88P 8888b.   .d8888b "Y888b.    .d8888b  8888b.  88888b.
    8888888P"     "88b d88P"       "Y88b. d88P"        "88b 888 "88b
    888       .d888888 888           "888 888      .d888888 888  888
    888       888  888 Y88b.   Y88b  d88P Y88b.    888  888 888  888
    888       "Y888888  "Y8888P "Y8888P"   "Y8888P "Y888888 888  888

[PacScan](https://github.com/Skelp/node-pacscan) provides information about all available packages for your module at
runtime by scanning `node_modules` as opposed to digging into dependency trees.

[![Build](https://img.shields.io/travis/Skelp/node-pacscan/develop.svg?style=flat-square)](https://travis-ci.org/Skelp/node-pacscan)
[![Coverage](https://img.shields.io/coveralls/Skelp/node-pacscan/develop.svg?style=flat-square)](https://coveralls.io/github/Skelp/node-pacscan)
[![Dependencies](https://img.shields.io/david/Skelp/node-pacscan.svg?style=flat-square)](https://david-dm.org/Skelp/node-pacscan)
[![Dev Dependencies](https://img.shields.io/david/dev/Skelp/node-pacscan.svg?style=flat-square)](https://david-dm.org/Skelp/node-pacscan#info=devDependencies)
[![License](https://img.shields.io/npm/l/pacscan.svg?style=flat-square)](https://github.com/Skelp/node-pacscan/blob/master/LICENSE.md)
[![Release](https://img.shields.io/npm/v/pacscan.svg?style=flat-square)](https://www.npmjs.com/package/pacscan)

* [Install](#install)
* [API](#api)
* [Bugs](#bugs)
* [Contributors](#contributors)
* [License](#license)

## Install

``` bash
$ npm install --save pacscan
```

You'll need to have at least [Node.js](https://nodejs.org) 4 or newer.

## API

### `pacscan([options])`

Scans for all packages available to your module asynchronously, returning a `Promise` to retrieve all of the package
information, each of which will be in a format similar to the following:

``` javascript
{
  // The directory of the package
  directory: '/path/to/my-example-package/node_modules/example-server',
  // The file path of the "main" file for the package or null if it has none
  main: '/path/to/my-example-package/node_modules/example-server/server.js',
  // The name of the package
  name: 'example-server',
  // The version of the package
  version: '3.2.1'
}
```

The `options` parameter is entirely optional and supports the following:

| Option           | Description                                                                                                                               | Default Value |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `includeParents` | Whether the highest level package directory should be scanned or only the lowest level base directory.                                      | `false` |
| `knockknock`     | Any options to be passed to [KnockKnock](https://github.com/Skelp/node-knockknock). `limit` will always be overridden to `1`.               | `null`  |
| `path`           | The file/directory path from where to derive the base directory to be scanned. Path to module that called PacScan will be used when `null`. | `null`  |

If you only want to list the packages available to your module/package:

``` javascript
const pacscan = require('pacscan')

module.exports = function() {
  pacscan()
    .then((packages) => {
      console.log(`${packages.length} packages found`)

      // ...
    })
}
```

However, if you're calling PacScan from within a library that is most likely being included in another package as a
dependency. In these cases, you might want to know all of the packages available in the base package (i.e. the highest
level package that is not a dependency itself). All that you need to do for this is to enable the `includeParents`
option.

### `pacscan.sync([options])`

A synchronous alternative to `pacscan([options])`.

``` javascript
const pacscan = require('pacscan')

module.exports = function() {
  const packages = pacscan.sync()

  console.log(`${packages.length} packages found`)

  // ...
}
```

### `pacscan.version`

The current version of PacScan.

``` javascript
const pacscan = require('pacscan')

pacscan.version
=> "0.1.0"
```

## Bugs

If you have any problems with PacScan or would like to see changes currently in development you can do so
[here](https://github.com/Skelp/node-pacscan/issues).

## Contributors

If you want to contribute, you're a legend! Information on how you can do so can be found in
[CONTRIBUTING.md](https://github.com/Skelp/node-pacscan/blob/master/CONTRIBUTING.md). We want your suggestions and pull
requests!

A list of PacScan contributors can be found in
[AUTHORS.md](https://github.com/Skelp/node-pacscan/blob/master/AUTHORS.md).

## License

See [LICENSE.md](https://github.com/Skelp/node-pacscan/raw/master/LICENSE.md) for more information on our MIT license.

© 2017 [Skelp](https://skelp.io)
<img align="right" width="16" height="16" src="https://cdn.rawgit.com/Skelp/skelp-branding/master/assets/logo/base/skelp-logo-16x16.png">
