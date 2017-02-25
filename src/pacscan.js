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

const debug = require('debug')('pacscan')
const glob = require('glob')
const path = require('path')
const pkgDir = require('pkg-dir')
const whoIsThere = require('knockknock')

const version = require('../package.json').version

// TODO: Add JSDoc

/**
 * A cache containing the available <code>package.json</code> file paths mapped to directory paths.
 *
 * The intention of this cache is to speed up available package lookups for repeat callers by avoiding file system
 * searches.
 *
 * @private
 * @type {Map.<string, pacscan~Package>}
 */
const availablePackagesCache = new Map()

/**
 * Scans for all available packages at either a given file/directory or at the module that called PacScan. It will find
 * the base package for that file path and then find and extract simple information from all accessible
 * <code>package.json</code> files, with the option to even find packages belonging to parent packages, where
 * applicable.
 *
 * @private
 */
class PacScan {

  static _findPackagePaths(patterns, options, callback) {
    const searches = patterns.map((pattern) => new Promise((resolve, reject) => {
      glob(pattern, options, (error, filePaths) => {
        /* istanbul ignore if */
        if (error) {
          reject(error)
        } else {
          resolve(filePaths)
        }
      })
    }))

    return Promise.all(searches)
      .then((values) => {
        let filePaths = []
        values.forEach((value) => {
          filePaths = filePaths.concat(value)
        })

        return filePaths
      })
      .then(callback)
  }

  static _findPackagePathsSync(patterns, options, callback) {
    let filePaths = []
    patterns.forEach((pattern) => {
      filePaths = filePaths.concat(glob.sync(pattern, options))
    })

    return callback(filePaths)
  }

  /**
   * Returns the information for the package installed in the directory at the path provided.
   *
   * This information contains <code>dirPath</code> as well as the <code>name</code>, <code>version</code>, and
   * (absolute) path of the <code>main</code> file (if any) read from the <code>package.json</code> file.
   *
   * This method should only be called when it is known that <code>dirPath</code> contains a <code>package.json</code>
   * file.
   *
   * @param {string} dirPath - the path of the installation directory for the package whose information is to be
   * returned
   * @return {pacscan~Package} The information for the package installed within <code>dirPath</code>.
   * @private
   * @static
   */
  static _getPackage(dirPath) {
    debug('Attempting to retrieve information for package installed in directory: %s', dirPath)

    const pkg = require(path.join(dirPath, 'package.json'))

    return {
      directory: dirPath,
      main: pkg.main ? path.join(dirPath, pkg.main) : null,
      name: pkg.name,
      version: pkg.version
    }
  }

  /**
   * Parses the optional input <code>options</code> provided, normalizing options and applying default values, where
   * needed.
   *
   * @param {?pacscan~Options} options - the input options to be parsed (may be <code>null</code> if none were provided)
   * @return {pacscan~Options} A new options object parsed from <code>options</code>.
   * @private
   * @static
   */
  static _parseOptions(options) {
    if (!options) {
      options = {}
    }

    return {
      includeParents: options.includeParents,
      knockknock: options.knockknock,
      path: options.path
    }
  }

  /**
   * Creates an instance of {@link PacScan} using the optional <code>options</code> provided.
   *
   * <code>sync</code> can be used to control whether package searches are performed synchronously or asynchronously.
   *
   * @param {boolean} sync - <code>true</code> if package searches should be synchronous or <code>false</code> if they
   * should be asynchronous
   * @param {pacscan~Options} [options] - the options to be used (may be <code>null</code>)
   * @public
   */
  constructor(sync, options) {
    /**
     * Whether package searches initiated by this {@link PacScan} should be made synchronously.
     *
     * @private
     * @type {boolean}
     */
    this._sync = sync

    /**
     * The parsed options for this {@link PacScan}.
     *
     * @private
     * @type {pacscan~Options}
     */
    this._options = PacScan._parseOptions(options)
  }

  scan() {
    return this._resolveBaseDirectory((dirPath) => {
      const packages = new Set()

      return this._findAvailablePackagePaths(dirPath, (filePaths) => {
        filePaths.forEach((filePath) => {
          const pkg = PacScan._getPackage(path.dirname(filePath))

          packages.add(Object.assign({}, pkg))
        })

        return Array.from(packages)
      })
    })
  }

  _findAvailablePackagePaths(dirPath, callback) {
    if (availablePackagesCache.has(dirPath)) {
      return callback(availablePackagesCache.get(dirPath))
    }

    debug('Attempting to find all packages files within directory: %s', dirPath)

    const options = { cwd: dirPath, nodir: true, nosort: true }
    const patterns = [
      '**/node_modules/*/package.json',
      '**/node_modules/@*/*/package.json'
    ]
    const packagePathFinder = PacScan[this._sync ? '_findPackagePathsSync' : '_findPackagePaths']

    return packagePathFinder(patterns, options, (filePaths) => this._isPackageDirectory(dirPath, (isPackage) => {
      if (isPackage) {
        filePaths.unshift('package.json')
      }

      filePaths = filePaths
        .sort()
        .map((filePath) => path.join(dirPath, filePath))

      availablePackagesCache.set(dirPath, filePaths)

      debug('Found %d packages files within directory: %s', filePaths.length, dirPath)

      return callback(filePaths)
    }))
  }

  _findBaseDirectory(filePath, callback) {
    return this._findPackageDirectory(filePath, (dirPath) => {
      if (dirPath == null) {
        return callback(null)
      }

      let parentDirPath = path.dirname(dirPath)
      let parentDirName = path.basename(parentDirPath)

      if (parentDirName.charAt(0) === '@') {
        parentDirPath = path.dirname(parentDirPath)
        parentDirName = path.basename(parentDirPath)
      }

      if (parentDirName === 'node_modules') {
        return this._findBaseDirectory(parentDirPath, (parentPkgDirPath) => {
          if (parentPkgDirPath != null) {
            dirPath = parentPkgDirPath
          }

          return callback(dirPath)
        })
      }

      return callback(dirPath)
    })
  }

  _findPackageDirectory(filePath, callback) {
    if (this._sync) {
      return callback(pkgDir.sync(filePath))
    }

    return pkgDir(filePath).then(callback)
  }

  _getCallers(callback) {
    const options = Object.assign({}, this._options.knockknock, { limit: 1 })

    if (options.excludes) {
      options.excludes = [ 'pacscan' ].concat(options.excludes)
    } else {
      options.excludes = [ 'pacscan' ]
    }

    if (this._sync) {
      return callback(whoIsThere.sync(options))
    }

    return whoIsThere(options).then(callback)
  }

  _isPackageDirectory(filePath, callback) {
    return this._findPackageDirectory(filePath, (dirPath) => callback(filePath === dirPath))
  }

  _resolveBaseDirectory(callback) {
    let baseDirectoryResolver
    if (this._options.path != null) {
      baseDirectoryResolver = this._resolveBaseDirectoryFromPath.bind(this)
    } else {
      baseDirectoryResolver = this._resolveBaseDirectoryFromCaller.bind(this)
    }

    return baseDirectoryResolver((filePath, pkg) => {
      if (filePath == null) {
        throw new Error('Could not resolve base directory as file was missing')
      }

      if (pkg == null) {
        const dirPath = path.dirname(filePath)

        debug('Unable to find package containing file "%s" so using parent directory as base: %s', filePath, dirPath)

        return callback(dirPath)
      }

      const dirPath = pkg.directory

      debug('Found package "%s" containing file: %s', pkg.name, filePath)

      if (!this._options.includeParents) {
        debug('Using installation directory for package containing file as base: %s', dirPath)

        return callback(dirPath)
      }

      debug('Attempting to find base parent package installation directory from package "%s" to use as base', pkg.name)

      return this._findBaseDirectory(dirPath, callback)
    })
  }

  _resolveBaseDirectoryFromCaller(callback) {
    return this._getCallers((callers) => {
      const caller = callers[0]
      if (caller != null) {
        return callback(caller.file, caller.package)
      }

      return callback(null, null)
    })
  }

  _resolveBaseDirectoryFromPath(callback) {
    const filePath = this._options.path

    return this._findPackageDirectory(filePath, (dirPath) => {
      const pkg = dirPath != null ? PacScan._getPackage(dirPath) : null

      return callback(filePath, pkg)
    })
  }

}

module.exports = function scan(options) {
  return Promise.resolve(new PacScan(false, options).scan())
}

/**
 * Clears the cache containing available <code>package.json</code> file paths mapped to directory paths which is used to
 * speed up package lookups for repeat callers by avoiding file system searches.
 *
 * This is primarily intended for testing purposes.
 *
 * @return {void}
 * @protected
 * @static
 */
module.exports.clearCache = function clearCache() {
  availablePackagesCache.clear()
}

module.exports.sync = function scanSync(options) {
  return new PacScan(true, options).scan()
}

/**
 * The current version of PacScan.
 *
 * @public
 * @static
 * @type {string}
 */
module.exports.version = version

/**
 * Contains some basic information for an individual package.
 *
 * @typedef {Object} pacscan~Package
 * @property {string} directory - The path to the installation directory of the package.
 * @property {?string} main - The path to the main file for the package (may be <code>null</code> if it has no
 * <code>main</code> entry).
 * @property {string} name - The name of the package.
 * @property {string} version - The version of the package.
 */

/**
 * The options to be used to scan for packages.
 *
 * @typedef {Object} pacscan~Options
 * @property {boolean} [includeParents] - TODO: Document
 * @property {knockknock~Options} [knockknock] - TODO: Document
 * @property {string} [path] - TODO: Document
 */
