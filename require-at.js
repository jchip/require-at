"use strict";

const Path = require("path");
const Module = require("module");
const Fs = require("fs");
// use eval to avoid tripping bundlers
const xrequire = eval("require");

const createRequireFromPath =
  Module.createRequireFromPath ||
  ((filename, dir) => {
    // https://github.com/nodejs/node/blob/1ae0511b942c01c6e0adff98643d350a395bf101/lib/internal/modules/cjs/loader.js#L748
    // https://github.com/nodejs/node/blob/1ae0511b942c01c6e0adff98643d350a395bf101/lib/internal/modules/cjs/helpers.js#L16
    const m = new Module(filename);

    m.filename = filename;
    m.paths = Module._nodeModulePaths(dir);

    // don't name this require to avoid tripping bundlers
    function _require(request) {
      // can't use m.require because there's an internal requireDepth thing
      // in the native Module implementation
      return xrequire(resolve(request));
    }

    function resolve(request, options) {
      return Module._resolveFilename(request, m, false, options);
    }

    _require.resolve = resolve;

    function paths(request) {
      return Module._resolveLookupPaths(request, m, true);
    }

    resolve.paths = paths;
    _require.main = process.mainModule;
    _require.extensions = Module._extensions;
    _require.cache = Module._cache;

    return _require;
  });

const cache = new Map();

function requireAt(dir, request) {
  const makeIt = (xdir, checked) => {
    let xRequire = requireAt.cache && requireAt.cache.get(xdir);

    if (!xRequire) {
      let stat;
      try {
        stat = Fs.statSync(xdir);
      } catch (e) {
        throw new Error(`require-at: stat '${xdir}' failed: ${e.message}`);
      }

      if (!stat || !stat.isDirectory()) {
        if (checked) throw new Error(`require-at: not a directory: '${dir}'`);
        return makeIt(Path.dirname(xdir), true);
      }

      xRequire = createRequireFromPath(Path.join(xdir, "._require-at_"), xdir);

      requireAt.cache && requireAt.cache.set(xdir, xRequire);
    }

    return request ? xRequire(request) : xRequire;
  };

  return makeIt(Path.resolve(dir), false);
}

requireAt.cache = cache;

module.exports = requireAt;
