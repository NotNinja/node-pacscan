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

describe('pacscan:fixture:flat', () => {
  before(() => helpers.copyFixture('flat'));

  context('when asynchronous', () => {
    before(() => pacscan.clearCache());

    context('and called from within base package', () => {
      it('should return promise for base package and its dependencies', () => {
        const flat = helpers.requireFromFixture('flat', 'index.js');

        return flat()
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

      context('and "includeParents" is enabled', () => {
        it('should return promise for base package and its dependencies', () => {
          const flat = helpers.requireFromFixture('flat', 'index.js');

          return flat({ includeParents: true })
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
    });

    context('and called from within dependency package', () => {
      it('should return promise for dependency package only', () => {
        const foo = helpers.requireFromFixture('flat', 'node_modules/foo/index.js');

        return foo()
          .then((packages) => {
            expect(packages).to.eql([
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/foo',
                main: 'flat/node_modules/foo/index.js',
                name: 'foo',
                version: '1.1.0'
              })
            ]);
          });
      });

      context('and "includeParents" is enabled', () => {
        it('should return promise for base package and its dependencies', () => {
          const foo = helpers.requireFromFixture('flat', 'node_modules/foo/index.js');

          return foo({ includeParents: true })
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
    });

    context('and called from within scoped dependency package', () => {
      it('should return promise for scoped dependency package only', () => {
        const fizz = helpers.requireFromFixture('flat', 'node_modules/@fu/fizz/index.js');

        return fizz()
          .then((packages) => {
            expect(packages).to.eql([
              helpers.resolvePackageForFixture({
                directory: 'flat/node_modules/@fu/fizz',
                main: 'flat/node_modules/@fu/fizz/index.js',
                name: '@fu/fizz',
                version: '1.3.1'
              })
            ]);
          });
      });

      context('and "includeParents" is enabled', () => {
        it('should return promise for base package and its dependencies', () => {
          const fizz = helpers.requireFromFixture('flat', 'node_modules/@fu/fizz/index.js');

          return fizz({ includeParents: true })
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
    });
  });

  context('when synchronous', () => {
    before(() => pacscan.clearCache());

    context('and called from within base package', () => {
      it('should return base package and its dependencies', () => {
        const flat = helpers.requireFromFixture('flat', 'index.js');
        const packages = flat.sync();

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

      context('and "includeParents" is enabled', () => {
        it('should return base package and its dependencies', () => {
          const flat = helpers.requireFromFixture('flat', 'index.js');
          const packages = flat.sync({ includeParents: true });

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

    context('and called from within dependency package', () => {
      it('should return dependency package only', () => {
        const foo = helpers.requireFromFixture('flat', 'node_modules/foo/index.js');
        const packages = foo.sync();

        expect(packages).to.eql([
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/foo',
            main: 'flat/node_modules/foo/index.js',
            name: 'foo',
            version: '1.1.0'
          })
        ]);
      });

      context('and "includeParents" is enabled', () => {
        it('should return base package and its dependencies', () => {
          const foo = helpers.requireFromFixture('flat', 'node_modules/foo/index.js');
          const packages = foo.sync({ includeParents: true });

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

    context('and called from within scoped dependency package', () => {
      it('should return scoped dependency package only', () => {
        const fizz = helpers.requireFromFixture('flat', 'node_modules/@fu/fizz/index.js');
        const packages = fizz.sync();

        expect(packages).to.eql([
          helpers.resolvePackageForFixture({
            directory: 'flat/node_modules/@fu/fizz',
            main: 'flat/node_modules/@fu/fizz/index.js',
            name: '@fu/fizz',
            version: '1.3.1'
          })
        ]);
      });

      context('and "includeParents" is enabled', () => {
        it('should return base package and its dependencies', () => {
          const fizz = helpers.requireFromFixture('flat', 'node_modules/@fu/fizz/index.js');
          const packages = fizz.sync({ includeParents: true });

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
  });
});
