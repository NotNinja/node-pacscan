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

const debug = require('debug')('pacscan');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const pkgDir = require('pkg-dir');
const whoIsThere = require('knockknock');

const version = require('../package.json').version;

/**
 * A cache containing the available <code>package.json</code> file paths mapped to directory paths.
 *
 * The intention of this cache is to speed up available package lookups for repeat callers by avoiding file system
 * searches.
 *
 * @private
 * @type {Map.<string, pacscan~Package>}
 */
const availablePackagesCache = new Map();

/**
 * A cache containing the parent package directories mapped to child directory paths.
 *
 * The intention of this cache is to speed up parent package directory lookups for repeat callers by avoiding file
 * system traversals.
 *
 * @private
 * @type {Map.<string, string>}
 */
const parentPackageDirectoriesCache = new Map();

/**
 * Scans for all available packages at either a given file/directory or at the module that called PacScan. It will find
 * the base package for that file path and then find and extract simple information from all accessible
 * <code>package.json</code> files, with the option to even find packages belonging to parent packages, where
 * applicable.
 *
 * @private
 */
class PacScan {

  /**
   * Asynchronously finds all files that match the specified <code>patterns</code> using the glob <code>options</code>
   * provided and passes the paths of these files to the <code>callback</code> function.
   *
   * This method returns a <code>Promise</code> chained using the <code>callback</code> function so that it can be
   * returned by {@link PacScan#scan}.
   *
   * @param {string[]} patterns - the glob patterns to be used to target <code>package.json</code> files
   * @param {Object} options - the glob options to be used
   * @param {pacscan~PackagePathsCallback} callback - the function to be called with the <code>package.json</code> file
   * paths
   * @return {Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   * @static
   */
  static _findPackagePaths(patterns, options, callback) {
    const searches = patterns.map((pattern) => new Promise((resolve, reject) => {
      glob(pattern, options, (error, filePaths) => {
        /* istanbul ignore if */
        if (error) {
          reject(error);
        } else {
          resolve(filePaths);
        }
      });
    }));

    return Promise.all(searches)
      .then((values) => {
        let filePaths = [];
        values.forEach((value) => {
          filePaths = filePaths.concat(value);
        });

        return filePaths;
      })
      .then(callback);
  }

  /**
   * Synchronously finds all files that match the specified <code>patterns</code> using the glob <code>options</code>
   * provided and passes the paths of these files to the <code>callback</code> function.
   *
   * This method returns the return value of the <code>callback</code> function so that it can be returned by
   * {@link PacScan#scan}.
   *
   * @param {string[]} patterns - the glob patterns to be used to target <code>package.json</code> files
   * @param {Object} options - the glob options to be used
   * @param {pacscan~PackagePathsCallback} callback - the function to be called with the <code>package.json</code> file
   * paths
   * @return {pacscan~Package[]} The result of calling <code>callback</code>.
   * @private
   * @static
   */
  static _findPackagePathsSync(patterns, options, callback) {
    let filePaths = [];
    patterns.forEach((pattern) => {
      filePaths = filePaths.concat(glob.sync(pattern, options));
    });

    return callback(filePaths);
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
    debug('Attempting to retrieve information for package installed in directory: %s', dirPath);

    const pkg = require(path.join(dirPath, 'package.json'));

    return {
      directory: dirPath,
      main: pkg.main ? path.join(dirPath, pkg.main) : null,
      name: pkg.name,
      version: pkg.version
    };
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
      options = {};
    }

    return {
      includeParents: options.includeParents,
      knockknock: options.knockknock,
      path: options.path
    };
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
    this._sync = sync;

    /**
     * The parsed options for this {@link PacScan}.
     *
     * @private
     * @type {pacscan~Options}
     */
    this._options = PacScan._parseOptions(options);
  }

  /**
   * Searches for all available packages within the base directory and returns a summary of the information for these
   * packages.
   *
   * This method will directly return the information for all available packages if this {@link PacScan} is synchronous.
   * Otherwise, this method will return a <code>Promise</code> which will be resolved with the information for all
   * available packages once they have been found.
   *
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The information for all available packages (or a
   * <code>Promise</code> resolved with them when asynchronous).
   * @public
   */
  scan() {
    return this._resolveBaseDirectory((dirPath) => {
      debug('Scanning for available packages within directory: %s', dirPath);

      return this._findAvailablePackagePaths(dirPath, (filePaths) => {
        debug('Found %d available packages within directory: %s', filePaths.length, dirPath);

        return filePaths.map((filePath) => {
          const pkg = PacScan._getPackage(path.dirname(filePath));

          return Object.assign({}, pkg);
        });
      });
    });
  }

  /**
   * Finds all <code>package.json</code> files that are available within the directory provided and passes the paths of
   * these files to the <code>callback</code> function.
   *
   * The flow for this method differs based on whether this {@link PacScan} is synchronous.
   *
   * @param {string} dirPath - the path to the directory to be searched
   * @param {pacscan~PackagePathsCallback} callback - the function to be called with the <code>package.json</code> file
   * paths
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   */
  _findAvailablePackagePaths(dirPath, callback) {
    if (availablePackagesCache.has(dirPath)) {
      return callback(availablePackagesCache.get(dirPath));
    }

    debug('Attempting to find all packages files within directory: %s', dirPath);

    const options = { cwd: dirPath, nodir: true, nosort: true };
    const patterns = [
      '**/node_modules/*/package.json',
      '**/node_modules/@*/*/package.json'
    ];
    const packagePathFinder = PacScan[this._sync ? '_findPackagePathsSync' : '_findPackagePaths'];

    return packagePathFinder(patterns, options, (filePaths) => this._isPackageDirectory(dirPath, (isPackage) => {
      if (isPackage) {
        filePaths.unshift('package.json');
      }

      filePaths = filePaths
        .sort()
        .map((filePath) => path.join(dirPath, filePath));

      availablePackagesCache.set(dirPath, filePaths);

      debug('Found %d packages files within directory: %s', filePaths.length, dirPath);

      return callback(filePaths);
    }));
  }

  /**
   * Finds the base directory from the specified <code>dirPath</code> and passes the path to the base directory to the
   * <code>callback</code> function.
   *
   * The base directory is basically the highest level package directory. This is determined by finding package
   * directories and climbing the <code>node_modules</code> directories until it can't anymore. At that point, the base
   * directory is found.
   *
   * This method should only be called when the <code>includeParents</code> option is enabled.
   *
   * @param {string} dirPath - the directory path from where the base directory should be found
   * @param {pacscan~BaseDirectoryCallback} callback - the function to be called with the path to the base directory
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   */
  _findBaseDirectory(dirPath, callback) {
    if (parentPackageDirectoriesCache.has(dirPath)) {
      return callback(parentPackageDirectoriesCache.get(dirPath));
    }

    return this._findPackageDirectory(dirPath, (childDirPath) => {
      if (childDirPath == null) {
        return callback(null);
      }

      let parentDirPath = path.dirname(childDirPath);
      let parentDirName = path.basename(parentDirPath);

      if (parentDirName.charAt(0) === '@') {
        parentDirPath = path.dirname(parentDirPath);
        parentDirName = path.basename(parentDirPath);
      }

      if (parentDirName === 'node_modules') {
        return this._findBaseDirectory(parentDirPath, (parentPkgDirPath) => {
          if (parentPkgDirPath != null) {
            childDirPath = parentPkgDirPath;
          }

          return callback(childDirPath);
        });
      }

      parentPackageDirectoriesCache.set(dirPath, childDirPath);

      return callback(childDirPath);
    });
  }

  /**
   * Finds the information for module that was responsible for calling PacScan and passes it to the
   * <code>callback</code> function.
   *
   * Consumers can control what modules/packages are considering during this search via the <code>knockknock</code>
   * option, however, the <code>limit</code> will always be overridden to <code>1</code>.
   *
   * The flow for this method differs based on whether this {@link PacScan} is synchronous.
   *
   * @param {pacscan~FindCallerCallback} callback - the function to be called with the caller information
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>
   * @private
   */
  _findCaller(callback) {
    const excludes = [ 'pacscan' ];
    const options = Object.assign({}, this._options.knockknock, { limit: 1 });

    options.excludes = options.excludes ? excludes.concat(options.excludes) : excludes;

    if (this._sync) {
      return callback(whoIsThere.sync(options)[0]);
    }

    return whoIsThere(options)
      .then((callers) => callers[0])
      .then(callback);
  }

  /**
   * Finds the installation directory for the package containing the specified <code>filePath</code> and passes the
   * directory path to the <code>callback</code> function.
   *
   * If <code>filePath</code> does not exist within a package, the directory path will be <code>null</code>.
   *
   * The flow for this method differs based on whether this {@link PacScan} is synchronous.
   *
   * @param {string} filePath - the path of the file whose package directory is to be found
   * @param {pacscan~FindPackageDirectoryCallback} callback - the function to be called with the package directory path
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   */
  _findPackageDirectory(filePath, callback) {
    if (this._sync) {
      return callback(pkgDir.sync(filePath));
    }

    return pkgDir(filePath).then(callback);
  }

  /**
   * Determines whether the specified <code>filePath</code> is a directory and passes the result to the
   * <code>callback</code> function.
   *
   * @param {string} filePath - the path of the file to be checked
   * @param {pacscan~IsDirectoryCallback} callback - the function to be called with the result
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   */
  _isDirectory(filePath, callback) {
    if (this._sync) {
      return callback(fs.statSync(filePath).isDirectory());
    }

    return new Promise((resolve, reject) => {
      fs.stat(filePath, (error, stats) => {
        /* istanbul ignore if */
        if (error) {
          reject(error);
        } else {
          resolve(stats.isDirectory());
        }
      });
    })
    .then(callback);
  }

  /**
   * Determines whether the specified <code>filePath</code> is a package installation directory and passes the result
   * to the <code>callback</code> function.
   *
   * @param {string} filePath - the path of the fiile to be checked
   * @param {pacscan~IsPackageDirectoryCallback} callback - the function to be called with the result
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   */
  _isPackageDirectory(filePath, callback) {
    return this._findPackageDirectory(filePath, (dirPath) => callback(filePath === dirPath));
  }

  /**
   * Resolves the base directory from where the package scan should originate and passes the directory path to the
   * <code>callback</code> function.
   *
   * If the <code>path</code> option is specified, it is treated as the base file (even if it's not a file). Otherwise,
   * the module that was responsible for calling PacScan is found and will be treated as the base file instead.
   *
   * If the base file belongs to a package, its directory will be used in the next step. Otherwise, the directory of the
   * base file is used instead.
   *
   * At this stage, we have a base directory, however, if the <code>includeParents</code> option is enabled, the
   * dependency tree (based on directory structure, not <code>package.json</code>) is climbed to find the highest level
   * base directory, where possible.
   *
   * @param {pacscan~BaseDirectoryCallback} callback - the function to be called with the base directory path
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   */
  _resolveBaseDirectory(callback) {
    let packageResolver;
    if (this._options.path != null) {
      packageResolver = this._resolvePackageFromPath.bind(this);
    } else {
      packageResolver = this._resolvePackageFromCaller.bind(this);
    }

    return packageResolver((filePath, pkg) => {
      if (filePath == null) {
        throw new Error('Could not resolve base directory as file was missing');
      }

      if (pkg == null) {
        return this._isDirectory(filePath, (isDirectory) => {
          const dirPath = isDirectory ? filePath : path.dirname(filePath);

          debug('Unable to find package containing file "%s" so using directory as base: %s', filePath, dirPath);

          return callback(dirPath);
        });
      }

      const dirPath = pkg.directory;

      debug('Found package "%s" containing file: %s', pkg.name, filePath);

      if (!this._options.includeParents) {
        debug('Using installation directory for package containing file as base: %s', dirPath);

        return callback(dirPath);
      }

      debug('Attempting to find base parent package installation directory from package "%s" to use as base', pkg.name);

      return this._findBaseDirectory(dirPath, callback);
    });
  }

  /**
   * Resolves the package from the module that was responsible for calling PacScan and passes the module file path and
   * package information to the <code>callback</code> function.
   *
   * If no caller information could be found, both the file path and package information will be <code>null</code> or,
   * if the calling module does not belong to a package, only the package information will be <code>null</code>.
   *
   * @param {pacscan~ResolvePackageCallback} callback - the function to be called with the file path and package
   * information derived from the calling module
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   */
  _resolvePackageFromCaller(callback) {
    return this._findCaller((caller) => {
      if (caller == null) {
        return callback(null, null);
      }

      return callback(caller.file, caller.package);
    });
  }

  /**
   * Resolves the package from the <code>path</code> option and passes the <code>path</code> option and package
   * information to the <code>callback</code> function.
   *
   * If the <code>path</code> option does not belong to a package, the package information will be <code>null</code>.
   *
   * @param {pacscan~ResolvePackageCallback} callback - the function to be called with the <code>path</code> option and
   * package information
   * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The result of calling <code>callback</code>.
   * @private
   */
  _resolvePackageFromPath(callback) {
    const filePath = this._options.path;

    return this._findPackageDirectory(filePath, (dirPath) => {
      const pkg = dirPath != null ? PacScan._getPackage(dirPath) : null;

      return callback(filePath, pkg);
    });
  }

}

/**
 * Asynchronously resolves the base directory from either the <code>path</code> option or the module that was
 * responsible for calling PacScan and then scans this directory for all packages available within it.
 *
 * The scan can also include packages from parent packages (for cases where the target module exists within a depedent
 * package - e.g. exists within another package's <code>node_modules</code> directory) by enabling the
 * <code>includeParents</code> option.
 *
 * The resolution of the calling module can be controlled at a more granular level by specifying <code>knockknock</code>
 * options.
 *
 * @param {pacscan~Options} [options] - the options to be used (may be <code>null</code>)
 * @return {Promise.<Error, pacscan~Package[]>} A <code>Promise</code> for retrieving the information for all available
 * packages.
 * @public
 * @static
 */
module.exports = function scan(options) {
  return Promise.resolve(new PacScan(false, options).scan());
};

/**
 * Clears the caches containing available <code>package.json</code> file paths and parent package directories mapped to
 * directory paths which is used to speed up package lookups for repeat callers by avoiding file system searches and
 * traversals.
 *
 * This is primarily intended for testing purposes.
 *
 * @return {void}
 * @protected
 * @static
 */
module.exports.clearCache = function clearCache() {
  availablePackagesCache.clear();
  parentPackageDirectoriesCache.clear();
};

/**
 * Synchronously resolves the base directory from either the <code>path</code> option or the module that was responsible
 * for calling PacScan and then scans this directory for all packages available within it.
 *
 * The scan can also include packages from parent packages (for cases where the target module exists within a depedent
 * package - e.g. exists within another package's <code>node_modules</code> directory) by enabling the
 * <code>includeParents</code> option.
 *
 * The resolution of the calling module can be controlled at a more granular level by specifying <code>knockknock</code>
 * options.
 *
 * @param {pacscan~Options} [options] - the options to be used (may be <code>null</code>)
 * @return {pacscan~Package[]} The information for all available packages.
 * @public
 * @static
 */
module.exports.sync = function sync(options) {
  return new PacScan(true, options).scan();
};

/**
 * The current version of PacScan.
 *
 * @public
 * @static
 * @type {string}
 */
module.exports.version = version;

/**
 * Called with the path of a base directory.
 *
 * @callback pacscan~BaseDirectoryCallback
 * @param {?string} dirPath - the path to the base directory (may be <code>null</code> if none could be found)
 * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The scan result.
 */

/**
 * Called with the information for the caller that was responsible for calling PacScan.
 *
 * @callback pacscan~FindCallerCallback
 * @param {?knockknock~Caller} caller - the caller information (may be <code>null</code> if no caller could be found)
 * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The scan result.
 */

/**
 * Called with the path to the package installation directory containing a file.
 *
 * @callback pacscan~FindPackageDirectoryCallback
 * @param {?string} dirPath - the path to the package installation directory (may be <code>null</code> if the file does
 * not belong to a package)
 * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The scan result.
 */

/**
 * Called with whether a file path points to an existing directory.
 *
 * @callback pacscan~IsDirectoryCallback
 * @param {boolean} isDirectory - <code>true</code> if the file path points to a directory; otherwise <code>false</code>
 * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The scan result.
 */

/**
 * Called with whether a file path points to a package installation directory.
 *
 * @callback pacscan~IsPackageDirectoryCallback
 * @param {boolean} isPackage - <code>true</code> if the file path points to a pacakge installation directory; otherwise
 * <code>false</code>
 * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The scan result.
 */

/**
 * Called with the absolute paths for all <code>package.json</code> files found within a directory.
 *
 * @callback pacscan~PackagePathsCallback
 * @param {string[]} filePaths - the paths to all available <code>package.json</code> files
 * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The scan result.
 */

/**
 * Called with the file path and package information resolved from a file path.
 *
 * @callback pacscan~ResolvePackageCallback
 * @param {?string} filePath - the path to the target file (may be <code>null</code> if it could not be resolved)
 * @param {?pacscan~Package} pkg - the package information (may be <code>null</code> if it could not be resolved or the
 * file does not belong to a package)
 * @return {pacscan~Package[]|Promise.<Error, pacscan~Package[]>} The scan result.
 */

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
 * @property {boolean} [includeParents] - <code>true</code> if the highest level package directory should be scanned or
 * <code>false</code> to scan only the initial base directory.
 * @property {knockknock~Options} [knockknock] - The options to be passed to <code>knockknock</code> when attempting to
 * determine the calling module (<code>limit</code> will always be overridden to <code>1</code>).
 * @property {string} [path] - The path of the file/directory from which the base directory to be scanned is derived.
 * The base directory should be derived from the module that was responsible for calling PacScan if this is
 * <code>null</code>.
 */
