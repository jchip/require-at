const Path = require("path");
const requireAt = require("../..");
const chai = require("chai");

describe("require-at", function() {
  it("should be able to require at another dir as relative dir", () => {
    const appRequire = requireAt("test/fixtures/app");
    const foo = appRequire("foo");
    chai.expect(foo).to.equal("foo");
  });

  it("should be able to require at another dir as absolute dir", () => {
    const appRequire = requireAt(Path.resolve("test/fixtures/app"));
    const foo = appRequire("foo");
    chai.expect(foo).to.equal("foo");
  });

  it("should throw if directory doesn't exist", () => {
    chai.expect(() => requireAt("foo/fixtures/app")).to.throw();
  });

  it("should require a file directly if passed", () => {
    const foo = requireAt("test/fixtures/app", "foo");
    chai.expect(foo).to.equal("foo");
  });

  it("should auto dirname on a file that's passed", () => {
    const foo = requireAt("test/fixtures/app/bar.js", "foo");
    chai.expect(foo).to.equal("foo");
  });
});
