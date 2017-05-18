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

describe('pacscan:fixture:unpackaged-single', () => {
  before(() => helpers.copyFixture('unpackaged-single'));

  context('when asynchronous', () => {
    before(() => pacscan.clearCache());

    context('and called from within base directory', () => {
      it('should return promise for empty array', () => {
        const unpackagedSingle = helpers.requireFromFixture('unpackaged-single', 'index.js');

        return unpackagedSingle()
          .then((packages) => {
            expect(packages).to.be.empty;
          });
      });
    });

    context('and "includeParents" is enabled', () => {
      it('should return promise for empty array', () => {
        const unpackagedSingle = helpers.requireFromFixture('unpackaged-single', 'index.js');

        return unpackagedSingle({ includeParents: true })
          .then((packages) => {
            expect(packages).to.be.empty;
          });
      });
    });
  });

  context('when synchronous', () => {
    before(() => pacscan.clearCache());

    context('and called from within base directory', () => {
      it('should return empty array', () => {
        const unpackagedSingle = helpers.requireFromFixture('unpackaged-single', 'index.js');
        const packages = unpackagedSingle.sync();

        expect(packages).to.be.empty;
      });

      context('and "includeParents" is enabled', () => {
        it('should return empty array', () => {
          const unpackagedSingle = helpers.requireFromFixture('unpackaged-single', 'index.js');
          const packages = unpackagedSingle.sync({ includeParents: true });

          expect(packages).to.be.empty;
        });
      });
    });
  });
});
