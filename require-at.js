"use strict";

const Path = require("path");
const Module = require("module");
const Fs = require("fs");

/////

const orig_findPath = Module._findPath;
const contextExt = "._require_at_";
const contextFname = `._hook_${contextExt}`;

Module._findPath = function(request, paths, isMain) {
  return request.endsWith(contextFname)
    ? request
    : orig_findPath.call(Module, request, paths, isMain);
};

Module._extensions[contextExt] = function(module, filename) {
  module._compile("module.exports = require;", filename);
};

/////

const contextMap = new Map();

function requireAt(dir, request) {
  let xRequire;
  dir = Path.resolve(dir);

  let dirChecked = false;

  const makeIt = () => {
    if (!contextMap.has(dir)) {
      let stat;
      try {
        stat = Fs.statSync(dir);
      } catch (e) {
        throw new Error(`require-at: stat '${dir}' failed: ${e.message}`);
      }

      if (!dirChecked && !stat.isDirectory()) {
        dirChecked = true;
        dir = Path.dirname(dir);
        return makeIt();
      }

      xRequire = require(Path.join(dir, contextFname));

      contextMap.set(dir, xRequire);
    } else {
      xRequire = contextMap.get(dir);
    }

    return request ? xRequire(request) : xRequire;
  };

  return makeIt();
}

module.exports = requireAt;
