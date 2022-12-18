global.I = new Proxy({}, {
  get(target, key) {
    const native = global[key];

    if (native === undefined) {
      throw Error(`'${key.toString()}' is not defined in global scope.`);
    }

    return (...args) => {
      return new Promise((resolve) => {
        setImmediate(() => {
          const result = native(...args);
          resolve(result);
        });
      });
    };
  }
});
