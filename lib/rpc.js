// noinspection JSUnresolvedFunction

/*
* todo
*  1. handle bidirectional communication [√]
*  2. clear registered reply events. [√]
*  3. timeout invocation. [√]
*  4. isolation?. [√]
*  5. support resource private event. [?]
*  6. support invoking client natives. [√]
* */

const RPC_TIMEOUT_IN_MS = 8000;

const rpcProxyHandler = {};

const isServer = IsDuplicityVersion();

function isFunction(value) {
  return value && typeof value === "function";
}

function concatReply(name, id) {
  return `${name}:reply:${id}`;
}

function constructRandomProvider() {
  let i = 0;
  return () => {
    return i++;
  }
}

const _newIdFn = constructRandomProvider()

function serverRegisteringRPCEvent(name, callback) {
  addNetEventListener(name, async (replyId, ...args) => {
    const playerServerId = global.source;
    const result = await callback(playerServerId, ...args);
    emitNet(concatReply(name, replyId), playerServerId, result);
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
      const id = _newIdFn()
      const replyName = concatReply(name, id);
      const rpcRelyStub = (result) => {
        removeEventListener(replyName, rpcRelyStub);
        r(result);
      };
      addNetEventListener(replyName, rpcRelyStub);
      emitNet(name, playerServerId, id, ...args);
      setTimeout(() => {
        removeEventListener(replyName, rpcRelyStub);
        e(`RPC ${name} invocation is timedout.`);
      }, RPC_TIMEOUT_IN_MS);
    });
  };
}


function clientRegisteringRPCEvent(name, callback) {
  addNetEventListener(name, async (replyId, ...args) => {
    const result = await callback(...args);
    emitNet(concatReply(name, replyId), result);
  });
}

function clientRPCRoutine(name) {
  return (...args) => {
    if (isFunction(args[0])) {
      return clientRegisteringRPCEvent(name, args[0]);
    }

    return new Promise((r, e) => {
      const id = _newIdFn()
      const replyName = concatReply(name, id);
      const rpcRelyStub = (result) => {
        removeEventListener(replyName, rpcRelyStub);
        r(result);
      };
      addNetEventListener(replyName, rpcRelyStub);
      emitNet(name, id, ...args);
      setTimeout(() => {
        removeEventListener(replyName, rpcRelyStub);
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
