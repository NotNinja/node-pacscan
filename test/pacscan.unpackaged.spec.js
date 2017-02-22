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

const expect = require('chai').expect

const helpers = require('./helpers')
const pacscan = require('../src/pacscan')

describe('pacscan:fixture:unpackaged', () => {
  before(() => helpers.copyFixture('unpackaged'))

  context('when asynchronous', () => {
    before(() => pacscan.clearCache())

    context('and called from within base directory', () => {
      it('should return promise for dependencies only', () => {
        const unpackaged = helpers.requireFromFixture('unpackaged', 'index.js')

        return unpackaged()
          .then((packages) => {
            expect(packages).to.eql([
              helpers.resolvePackageForFixture({
                directory: 'unpackaged/node_modules/foo/node_modules/bar',
                main: 'unpackaged/node_modules/foo/node_modules/bar/index',
                name: 'bar',
                version: '1.2.0'
              }),
              helpers.resolvePackageForFixture({
                directory: 'unpackaged/node_modules/foo',
                main: 'unpackaged/node_modules/foo/index.js',
                name: 'foo',
                version: '1.1.0'
              })
            ])
          })
      })

      context('and "includeParents" is enabled', () => {
        it('should return promise for dependencies only', () => {
          const unpackaged = helpers.requireFromFixture('unpackaged', 'index.js')

          return unpackaged({ includeParents: true })
            .then((packages) => {
              expect(packages).to.eql([
                helpers.resolvePackageForFixture({
                  directory: 'unpackaged/node_modules/foo/node_modules/bar',
                  main: 'unpackaged/node_modules/foo/node_modules/bar/index',
                  name: 'bar',
                  version: '1.2.0'
                }),
                helpers.resolvePackageForFixture({
                  directory: 'unpackaged/node_modules/foo',
                  main: 'unpackaged/node_modules/foo/index.js',
                  name: 'foo',
                  version: '1.1.0'
                })
              ])
            })
        })
      })
    })

    context('and called from within dependency package', () => {
      it('should return promise for dependencies only', () => {
        const foo = helpers.requireFromFixture('unpackaged', 'node_modules/foo/index.js')

        return foo()
          .then((packages) => {
            expect(packages).to.eql([
              helpers.resolvePackageForFixture({
                directory: 'unpackaged/node_modules/foo/node_modules/bar',
                main: 'unpackaged/node_modules/foo/node_modules/bar/index',
                name: 'bar',
                version: '1.2.0'
              }),
              helpers.resolvePackageForFixture({
                directory: 'unpackaged/node_modules/foo',
                main: 'unpackaged/node_modules/foo/index.js',
                name: 'foo',
                version: '1.1.0'
              })
            ])
          })
      })

      context('and "includeParents" is enabled', () => {
        it('should return promise for dependencies only', () => {
          const foo = helpers.requireFromFixture('unpackaged', 'node_modules/foo/index.js')

          return foo({ includeParents: true })
            .then((packages) => {
              expect(packages).to.eql([
                helpers.resolvePackageForFixture({
                  directory: 'unpackaged/node_modules/foo/node_modules/bar',
                  main: 'unpackaged/node_modules/foo/node_modules/bar/index',
                  name: 'bar',
                  version: '1.2.0'
                }),
                helpers.resolvePackageForFixture({
                  directory: 'unpackaged/node_modules/foo',
                  main: 'unpackaged/node_modules/foo/index.js',
                  name: 'foo',
                  version: '1.1.0'
                })
              ])
            })
        })
      })
    })

    context('and called from within nested dependency package', () => {
      it('should return promise for nested dependency package only', () => {
        const bar = helpers.requireFromFixture('unpackaged', 'node_modules/foo/node_modules/bar/index.js')

        return bar()
          .then((packages) => {
            expect(packages).to.eql([
              helpers.resolvePackageForFixture({
                directory: 'unpackaged/node_modules/foo/node_modules/bar',
                main: 'unpackaged/node_modules/foo/node_modules/bar/index',
                name: 'bar',
                version: '1.2.0'
              })
            ])
          })
      })

      context('and "includeParents" is enabled', () => {
        it('should return promise for dependencies only', () => {
          const bar = helpers.requireFromFixture('unpackaged', 'node_modules/foo/node_modules/bar/index.js')

          return bar({ includeParents: true })
            .then((packages) => {
              expect(packages).to.eql([
                helpers.resolvePackageForFixture({
                  directory: 'unpackaged/node_modules/foo/node_modules/bar',
                  main: 'unpackaged/node_modules/foo/node_modules/bar/index',
                  name: 'bar',
                  version: '1.2.0'
                }),
                helpers.resolvePackageForFixture({
                  directory: 'unpackaged/node_modules/foo',
                  main: 'unpackaged/node_modules/foo/index.js',
                  name: 'foo',
                  version: '1.1.0'
                })
              ])
            })
        })
      })
    })
  })

  context('when synchronous', () => {
    before(() => pacscan.clearCache())

    context('and called from within base directory', () => {
      it('should return dependencies only', () => {
        const unpackaged = helpers.requireFromFixture('unpackaged', 'index.js')
        const packages = unpackaged.sync()

        expect(packages).to.eql([
          helpers.resolvePackageForFixture({
            directory: 'unpackaged/node_modules/foo/node_modules/bar',
            main: 'unpackaged/node_modules/foo/node_modules/bar/index',
            name: 'bar',
            version: '1.2.0'
          }),
          helpers.resolvePackageForFixture({
            directory: 'unpackaged/node_modules/foo',
            main: 'unpackaged/node_modules/foo/index.js',
            name: 'foo',
            version: '1.1.0'
          })
        ])
      })

      context('and "includeParents" is enabled', () => {
        it('should return dependencies only', () => {
          const unpackaged = helpers.requireFromFixture('unpackaged', 'index.js')
          const packages = unpackaged.sync({ includeParents: true })

          expect(packages).to.eql([
            helpers.resolvePackageForFixture({
              directory: 'unpackaged/node_modules/foo/node_modules/bar',
              main: 'unpackaged/node_modules/foo/node_modules/bar/index',
              name: 'bar',
              version: '1.2.0'
            }),
            helpers.resolvePackageForFixture({
              directory: 'unpackaged/node_modules/foo',
              main: 'unpackaged/node_modules/foo/index.js',
              name: 'foo',
              version: '1.1.0'
            })
          ])
        })
      })
    })

    context('and called from within dependency package', () => {
      it('should return dependencies only', () => {
        const foo = helpers.requireFromFixture('unpackaged', 'node_modules/foo/index.js')
        const packages = foo.sync()

        expect(packages).to.eql([
          helpers.resolvePackageForFixture({
            directory: 'unpackaged/node_modules/foo/node_modules/bar',
            main: 'unpackaged/node_modules/foo/node_modules/bar/index',
            name: 'bar',
            version: '1.2.0'
          }),
          helpers.resolvePackageForFixture({
            directory: 'unpackaged/node_modules/foo',
            main: 'unpackaged/node_modules/foo/index.js',
            name: 'foo',
            version: '1.1.0'
          })
        ])
      })

      context('and "includeParents" is enabled', () => {
        it('should return dependencies only', () => {
          const foo = helpers.requireFromFixture('unpackaged', 'node_modules/foo/index.js')
          const packages = foo.sync({ includeParents: true })

          expect(packages).to.eql([
            helpers.resolvePackageForFixture({
              directory: 'unpackaged/node_modules/foo/node_modules/bar',
              main: 'unpackaged/node_modules/foo/node_modules/bar/index',
              name: 'bar',
              version: '1.2.0'
            }),
            helpers.resolvePackageForFixture({
              directory: 'unpackaged/node_modules/foo',
              main: 'unpackaged/node_modules/foo/index.js',
              name: 'foo',
              version: '1.1.0'
            })
          ])
        })
      })
    })

    context('and called from within nested dependency package', () => {
      it('should return nested dependency package only', () => {
        const bar = helpers.requireFromFixture('unpackaged', 'node_modules/foo/node_modules/bar/index.js')
        const packages = bar.sync()

        expect(packages).to.eql([
          helpers.resolvePackageForFixture({
            directory: 'unpackaged/node_modules/foo/node_modules/bar',
            main: 'unpackaged/node_modules/foo/node_modules/bar/index',
            name: 'bar',
            version: '1.2.0'
          })
        ])
      })

      context('and "includeParents" is enabled', () => {
        it('should return dependencies only', () => {
          const bar = helpers.requireFromFixture('unpackaged', 'node_modules/foo/node_modules/bar/index.js')
          const packages = bar.sync({ includeParents: true })

          expect(packages).to.eql([
            helpers.resolvePackageForFixture({
              directory: 'unpackaged/node_modules/foo/node_modules/bar',
              main: 'unpackaged/node_modules/foo/node_modules/bar/index',
              name: 'bar',
              version: '1.2.0'
            }),
            helpers.resolvePackageForFixture({
              directory: 'unpackaged/node_modules/foo',
              main: 'unpackaged/node_modules/foo/index.js',
              name: 'foo',
              version: '1.1.0'
            })
          ])
        })
      })
    })
  })
})
