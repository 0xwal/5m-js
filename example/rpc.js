/*
* todo
*  1. handle bidirectional communication [√]
*  2. clear registered reply events. [√]
*  3. timeout invocation. [√]
*  4. isolation?. [?]
*  5. support resource private event.
*  6. support invoking client natives.
* */

const RPC_TIMEOUT_IN_MS = 8000;

const rpcProxyHandler = {};

const isServer = IsDuplicityVersion();

function isFunction(value) {
  return value && typeof value === "function";
}

function serverRegisteringRPCEvent(name, callback) {
  addNetEventListener(name, async (...args) => {
    const playerServerId = global.source;
    const result = await callback(playerServerId, ...args);
    emitNet(`${name}:reply`, playerServerId, result);
  });
}

function serverRPCRoutine(name) {
  return async (...args) => {
    if (args[0] === undefined) {
      // invoke on all clients | doesn't make sense?
      throw new Error("Expected a player serve id.");
    }

    if (isFunction(args[0])) {
      return serverRegisteringRPCEvent(name, args[0]);
    }

    const playerServerId = args[0];

    args = args.splice(1);

    return new Promise((r, e) => {
      const rpcRelyStub = (result) => {
        removeEventListener(`${name}:reply`, rpcRelyStub);
        r(result);
      };
      addNetEventListener(`${name}:reply`, rpcRelyStub);
      emitNet(name, playerServerId, ...args);
      setTimeout(() => {
        removeEventListener(`${name}:reply`, rpcRelyStub);
        e(`RPC ${name} invocation is timedout.`);
      }, RPC_TIMEOUT_IN_MS);
    });
  };
}


function clientRegisteringRPCEvent(name, callback) {
  addNetEventListener(name, async (...args) => {
    const result = await callback(...args);
    emitNet(`${name}:reply`, result);
  });
}

function clientRPCRoutine(name) {
  return (...args) => {
    if (isFunction(args[0])) {
      return clientRegisteringRPCEvent(name, args[0]);
    }

    return new Promise((r, e) => {
      const rpcRelyStub = (result) => {
        removeEventListener(`${name}:reply`, rpcRelyStub);
        r(result);
      };
      addNetEventListener(`${name}:reply`, rpcRelyStub);
      emitNet(name, ...args);
      setTimeout(() => {
        removeEventListener(`${name}:reply`, rpcRelyStub);
        e(`RPC ${name} invocation is timedout.`);
      }, RPC_TIMEOUT_IN_MS);
    });
  };
}


let nativeProxy
if (isServer) {
  nativeProxy = new Proxy({}, {
    get(target, p, receiver) {
      const nativeName = p.toString();
      return (...args) => {
        const playerServerId = args[0];
        args = args.splice(1);
        return rpcProxyHandler.get(target, "rpc:native")(playerServerId, nativeName, ...args);
      };
    }
  });
}


// register
rpcProxyHandler.get = (target, name) => {
  if (isServer) {
    if (name === "native") {
      return nativeProxy;
    }
    return serverRPCRoutine(name);
  }

  return clientRPCRoutine(name);
};


global.rpc = new Proxy({}, rpcProxyHandler);
if (!isServer) {
  rpc["rpc:native"](function (nativeName, ...args) {
    const result = global[nativeName](...args);
    return result;
  });
}
