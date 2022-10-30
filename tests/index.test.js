const assert = require("assert");

require("../lib/index");

global.nFunction = () => {
  return 123;
};

assert.notEqual(I, undefined);

assert.notEqual(I.nFunction, undefined);

assert.equal(typeof I.nFunction, typeof Function);

assert.equal(typeof I.nFunction().then, typeof Function);

I.nFunction().then((r) => {
  assert.equal(r, 123);
});

global.nFunctionWithArgs = (...args) => {
  assert.deepEqual(args, [1, 2, 3, 4]);
  return args.reduce((acc, a) => acc + a, 0);
}

I.nFunctionWithArgs(1, 2, 3, 4).then((r) => {
  assert.equal(r, 10);
});

assert.throws(() => {
  I.not_exist_function();
}, "'not_exist_function' is not exist in global scope.");
