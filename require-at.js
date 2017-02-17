"use strict";

const Path = require("path");
const Module = require("module");
const Fs = require("fs");

/////

const orig_findPath = Module._findPath;
const contextExt = ".____context____";
const contextFname = `____resolve____${contextExt}`;

Module._findPath = function (request, paths, isMain) {
  return request.endsWith(contextFname) ? request :
    orig_findPath.call(Module, request, paths, isMain);
};

Module._extensions[contextExt] = function (module, filename) {
  module._compile("module.exports = require;", filename);
};

/////

const contextMap = new Map();

function requireAt(dir, request) {
  let xRequire;
  dir = Path.resolve(dir);
  if (!contextMap.has(dir)) {
    if (!Fs.existsSync(dir)) {
      throw new Error(`require-at: dir '${dir}' doesn't exist`);
    }
    xRequire = require(Path.join(dir, contextFname));
    contextMap.set(dir, xRequire);
  } else {
    xRequire = contextMap.get(dir);
  }

  return request ? xRequire(request) : xRequire;
}

module.exports = requireAt;
