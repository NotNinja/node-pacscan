/*
 * Copyright (C) 2017 Alasdair Mercer, Skelp
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict'

const mkdirp = require('mkdirp')
const ncp = require('ncp').ncp
const path = require('path')
const tmp = require('tmp')

// TODO: Add JSDoc

let tempDirPath

exports.copyFixture = function copyFixture(name) {
  return new Promise((resolve, reject) => {
    const dirPath = exports.getFixtureDirectory(name)

    mkdirp.sync(dirPath)

    ncp(path.join(__dirname, 'fixtures', name), dirPath, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve(dirPath)
      }
    })
  })
}

exports.createOptions = function createOptions(options) {
  if (!options) {
    options = {}
  }

  const knockknock = Object.assign({}, options.knockknock)
  knockknock.excludes = [ 'chai', 'mocha' ].concat(knockknock.excludes || [])

  options.knockknock = knockknock

  return options
}

exports.getFixtureDirectory = function getFixtureDirectory(name) {
  return path.join(exports.getTempDirectory(), 'fixtures', name)
}

exports.getTempDirectory = function getTempDirectory() {
  if (tempDirPath == null) {
    tmp.setGracefulCleanup()

    tempDirPath = tmp.dirSync().name
  }

  return tempDirPath
}

exports.requireFromFixture = function requireFromFixture(name, filePath) {
  const fixture = require(exports.resolveFixtureFile(name, filePath))
  const pacscanPath = path.resolve(__dirname, '../src/pacscan')

  const proxy = function proxy(options) {
    return fixture(pacscanPath, exports.createOptions(options))
  }
  proxy.sync = function proxySync(options) {
    return fixture.sync(pacscanPath, exports.createOptions(options))
  }

  return proxy
}

exports.resolveFixtureFile = function resolveFixtureFile(name, filePath) {
  return path.resolve(exports.getFixtureDirectory(name), filePath)
}

exports.resolvePackageForFixture = function resolvePackageForFixture(pkg) {
  const dirPath = path.join(exports.getTempDirectory(), 'fixtures')

  pkg.directory = path.resolve(dirPath, pkg.directory)
  if (pkg.main != null) {
    pkg.main = path.resolve(dirPath, pkg.main)
  }

  return pkg
}
