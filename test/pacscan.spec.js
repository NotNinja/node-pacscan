/*
 * Copyright (C) 2017 Alasdair Mercer, !ninja
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

'use strict';

const expect = require('chai').expect;

const helpers = require('./helpers');
const pacscan = require('../src/pacscan');
const version = require('../package.json').version;

describe('pacscan', () => {
  before(() => {
    return Promise.all([
      helpers.copyFixture('flat'),
      helpers.copyFixture('unpackaged')
    ]);
  });

  context('when asynchronous', () => {
    before(() => pacscan.clearCache());

    context('and called from unknown source without "path"', () => {
      it('should return promise rejected', () => {
        return pacscan(helpers.createOptions())
          .then(() => {
            throw new Error('Expected promise to be rejected');
          })
          .catch((error) => {
            expect(error.message).to.equal('Could not resolve base directory as file was missing');
          });
      });
    });

    context('and no options are provided', () => {
      it('should use default options', () => {
        return pacscan()
          .then((packages) => {
            // mocha modules are only excluded by helpers.createOptions, so will now be included
            expect(packages).to.have.length.of.at.least(1);
          });
      });
    });

    context('and "path" targets package directory', () => {
      it('should return promise for package and its dependencies', () => {
        const dirPath = helpers.getFixtureDirectory('flat');

        return pacscan(helpers.createOptions({ path: dirPath }))
          .then((packages) => {
            expect(packages).to.eql([
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@baz/buzz',
                main: 'flat/node_modules/@baz/buzz/index.js',
                name: '@baz/buzz',
                version: '1.4.2'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@baz/fizz',
                main: null,
                name: '@baz/fizz',
                version: '1.4.1'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@fu/buzz',
                main: 'flat/node_modules/@fu/buzz/index.js',
                name: '@fu/buzz',
                version: '1.3.2'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@fu/fizz',
                main: 'flat/node_modules/@fu/fizz/index.js',
                name: '@fu/fizz',
                version: '1.3.1'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/bar',
                main: 'flat/node_modules/bar/index',
                name: 'bar',
                version: '1.2.0'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/foo',
                main: 'flat/node_modules/foo/index.js',
                name: 'foo',
                version: '1.1.0'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat',
                main: 'flat/index.js',
                name: 'flat',
                version: '1.0.0'
              })
            ]);
          });
      });
    });

    context('and "path" targets packaged file', () => {
      it('should return promise for package and its dependencies', () => {
        const filePath = helpers.resolveFixtureFile('flat', 'index.js');

        return pacscan(helpers.createOptions({ path: filePath }))
          .then((packages) => {
            expect(packages).to.eql([
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@baz/buzz',
                main: 'flat/node_modules/@baz/buzz/index.js',
                name: '@baz/buzz',
                version: '1.4.2'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@baz/fizz',
                main: null,
                name: '@baz/fizz',
                version: '1.4.1'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@fu/buzz',
                main: 'flat/node_modules/@fu/buzz/index.js',
                name: '@fu/buzz',
                version: '1.3.2'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@fu/fizz',
                main: 'flat/node_modules/@fu/fizz/index.js',
                name: '@fu/fizz',
                version: '1.3.1'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/bar',
                main: 'flat/node_modules/bar/index',
                name: 'bar',
                version: '1.2.0'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/foo',
                main: 'flat/node_modules/foo/index.js',
                name: 'foo',
                version: '1.1.0'
              }),
              helpers.resolvePackageForFixture({
                directory: 'flat',
                main: 'flat/index.js',
                name: 'flat',
                version: '1.0.0'
              })
            ]);
          });
      });
    });

    context('and "path" targets unpackaged directory', () => {
      it('should return promise for dependencies only', () => {
        const dirPath = helpers.getFixtureDirectory('unpackaged');

        return pacscan(helpers.createOptions({ path: dirPath }))
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
            ]);
          });
      });
    });

    context('and "path" targets unpackaged file', () => {
      it('should return promise for dependencies only', () => {
        const filePath = helpers.resolveFixtureFile('unpackaged', 'index.js');

        return pacscan(helpers.createOptions({ path: filePath }))
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
            ]);
          });
      });
    });
  });

  context('when synchronous', () => {
    before(() => pacscan.clearCache());

    context('and called from unknown source without "path"', () => {
      it('should throw error', () => {
        expect(() => {
          pacscan.sync(helpers.createOptions());
        }).to.throw(Error, 'Could not resolve base directory as file was missing');
      });
    });

    context('and no options are provided', () => {
      it('should use default options', () => {
        const packages = pacscan.sync();

        // mocha modules are only excluded by helpers.createOptions, so will now be included
        expect(packages).to.have.length.of.at.least(1);
      });
    });

    context('and "path" targets package directory', () => {
      it('should return package and its dependencies', () => {
        const dirPath = helpers.getFixtureDirectory('flat');
        const packages = pacscan.sync(helpers.createOptions({ path: dirPath }));

        expect(packages).to.eql([
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@baz/buzz',
            main: 'flat/node_modules/@baz/buzz/index.js',
            name: '@baz/buzz',
            version: '1.4.2'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@baz/fizz',
            main: null,
            name: '@baz/fizz',
            version: '1.4.1'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@fu/buzz',
            main: 'flat/node_modules/@fu/buzz/index.js',
            name: '@fu/buzz',
            version: '1.3.2'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@fu/fizz',
            main: 'flat/node_modules/@fu/fizz/index.js',
            name: '@fu/fizz',
            version: '1.3.1'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/bar',
            main: 'flat/node_modules/bar/index',
            name: 'bar',
            version: '1.2.0'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/foo',
            main: 'flat/node_modules/foo/index.js',
            name: 'foo',
            version: '1.1.0'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat',
            main: 'flat/index.js',
            name: 'flat',
            version: '1.0.0'
          })
        ]);
      });
    });

    context('and "path" targets packaged file', () => {
      it('should return package and its dependencies', () => {
        const filePath = helpers.resolveFixtureFile('flat', 'index.js');
        const packages = pacscan.sync(helpers.createOptions({ path: filePath }));

        expect(packages).to.eql([
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@baz/buzz',
            main: 'flat/node_modules/@baz/buzz/index.js',
            name: '@baz/buzz',
            version: '1.4.2'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@baz/fizz',
            main: null,
            name: '@baz/fizz',
            version: '1.4.1'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@fu/buzz',
            main: 'flat/node_modules/@fu/buzz/index.js',
            name: '@fu/buzz',
            version: '1.3.2'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@fu/fizz',
            main: 'flat/node_modules/@fu/fizz/index.js',
            name: '@fu/fizz',
            version: '1.3.1'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/bar',
            main: 'flat/node_modules/bar/index',
            name: 'bar',
            version: '1.2.0'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/foo',
            main: 'flat/node_modules/foo/index.js',
            name: 'foo',
            version: '1.1.0'
          }),
          helpers.resolvePackageForFixture({
            directory: 'flat',
            main: 'flat/index.js',
            name: 'flat',
            version: '1.0.0'
          })
        ]);
      });
    });

    context('and "path" targets unpackaged directory', () => {
      it('should return dependencies only', () => {
        const dirPath = helpers.getFixtureDirectory('unpackaged');
        const packages = pacscan.sync(helpers.createOptions({ path: dirPath }));

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
        ]);
      });
    });

    context('and "path" targets unpackaged file', () => {
      it('should return dependencies only', () => {
        const filePath = helpers.resolveFixtureFile('unpackaged', 'index.js');
        const packages = pacscan.sync(helpers.createOptions({ path: filePath }));

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
        ]);
      });
    });
  });

  describe('.version', () => {
    it('should match package version', () => {
      expect(pacscan.version).to.equal(version);
    });
  });
});
