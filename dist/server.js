// lib/native-wrapper.ts
var I = new Proxy({}, {
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
// lib/server/rpc.ts
var RESOURCE_NAME = GetCurrentResourceName();
var MAX_TIMEOUT = GetConvarInt("rpc_timeout", 15 * 1000);
var pendingInvocations = new Map;
var remoteRPCs = new Set;
var localRPCs = new Set;
var id = 0;
function localResourceName(name) {
  return `${RESOURCE_NAME}:rpc:${name}`;
}
function isThenable(value) {
  return value !== null && (typeof value === "object" || typeof value === "function") && "then" in value && typeof value.then === "function";
}
function nextId() {
  return `${new Date().getTime()}${id++}`;
}
var log = function() {
  const logging = GetConvar("log", "false") === "true";
  if (logging) {
    return (...args) => console.log("debug:", ...args);
  }
  return () => {};
}();
onNet(localResourceName("reply"), async (id2, result) => {
  log(`Received RPC reply for invocation [${id2}] with result:`, JSON.stringify(result));
  const invocation = pendingInvocations.get(id2);
  if (!invocation) {
    log(`RPC reply for invocation [${id2}] not found`);
    throw new Error(`RPC invocation [${id2}] not found`);
  }
  clearTimeout(invocation.timeout);
  pendingInvocations.delete(id2);
  if (result.ok) {
    log(`RPC method [${invocation.method}] invocation [${id2}] for [${invocation.serverId}] succeeded with result:`, JSON.stringify(result.value));
    invocation.resolve(result.value);
  } else {
    log(`RPC method [${invocation.method}] invocation [${id2}] for [${invocation.serverId}] failed with error:`, JSON.stringify(result.error));
    invocation.reject(new Error(`Error when executing [${invocation.method}] client [${invocation.serverId}]: ${result.error}`));
  }
});
onNet(localResourceName("register"), async (method) => {
  log(`Registering client RPC method [${method}]`);
  remoteRPCs.add(method);
});
onNet(localResourceName("get-names"), async () => {
  const serveId = global.source;
  log(`Emitting RPC names for [${serveId}]`);
  emitNet(localResourceName("names"), serveId, Array.from(localRPCs));
});
function invoke(method, serverId, ...args) {
  const promise = new Promise((resolve, reject) => {
    if (!remoteRPCs.has(method)) {
      return reject(new Error(`Invalid RPC method [${method}]`));
    }
    const id2 = nextId();
    const timeout = setTimeout(() => {
      pendingInvocations.delete(id2);
      log(`RPC method [${method}] for [${serverId}] with invocation id [${id2}] timed out`);
      reject(new Error(`Timeout when invoking [${method}].`));
    }, MAX_TIMEOUT);
    pendingInvocations.set(id2, {
      resolve,
      reject,
      timeout,
      method,
      serverId
    });
    log(`Invoking RPC method [${method}] for [${serverId}] with invocation id [${id2}] and args:`, JSON.stringify(args));
    emitNet(localResourceName(method), serverId, id2, ...args);
  });
  return promise;
}
function register(method, handler) {
  log(`Registering RPC handler for [${method}]`);
  const rpcName = localResourceName(method);
  onNet(rpcName, async (id2, ...args) => {
    const serverId = global.source;
    try {
      log(`Invoking RPC handler for [${method}] from ${serverId} with args:${JSON.stringify(args)}`);
      let result = handler(serverId, ...args);
      if (isThenable(result)) {
        log(`RPC handler for [${method}] returned a promise, waiting for it to resolve`);
        const now = Date.now();
        result = await result;
        log(`RPC handler for [${method}] resolved in ${Date.now() - now}ms`);
      }
      log(`RPC handler for [${method}] returned`, JSON.stringify(result));
      emitNet(localResourceName("reply"), serverId, id2, { ok: true, value: result });
    } catch (e) {
      const message = e?.message ?? e;
      log(`RPC handler for [${method}] failed with error:`, e);
      emitNet(localResourceName("reply"), serverId, id2, { ok: false, error: message });
    }
  });
  localRPCs.add(method);
}
var rpc = new Proxy({}, {
  get(_target, method) {
    return (...args) => {
      const isFunction = typeof args[0] === "function";
      if (isFunction) {
        return register(method, args[0]);
      }
      const serverId = args[0];
      const rest = args.splice(1);
      return invoke(method, serverId, ...rest);
    };
  }
});
export {
  rpc,
  register,
  localResourceName,
  invoke,
  MAX_TIMEOUT,
  I
};
