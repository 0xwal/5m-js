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

const RPC_TIMEOUT_IN_MS = ((60 * 1000) * 5); // to ensure we clean stale non-resolved promises.

const rpcProxyHandler = {};

const isServer = IsDuplicityVersion();

const registeredRPC = {};
const localRegisteredRPCNames = {};

const resourceName = GetCurrentResourceName();

function localResourceName(name) {
	return `${resourceName}:${name}`;
}

const log = (function () {
	const logging = GetConvar("log", "false") === "true";
	if (logging) {
		return (...args) => console.log("debug:", ...args);
	}
	return () => {
	};
})();

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
	};
}

const _newIdFn = constructRandomProvider();

onNet(localResourceName("rpc:register"), function (name) {
	registeredRPC[name] = true;
});

function serverRegisteringRPCEvent(name, callback) {
	log(`registering server rpc function [${name}]`);
	addNetEventListener(name, async (replyId, ...args) => {
		const playerServerId = global.source;
		const result = await callback(playerServerId, ...args);
		emitNet(concatReply(name, replyId), playerServerId, result);
	});
	localRegisteredRPCNames[name] = true;
	emitNet(localResourceName("rpc:register"), -1, name);
	log(`updating all client about the registered rpc function [${name}]`);
}

function serverRPCRoutine(name) {
	return async (...args) => {
		if (args[0] === undefined) {
			// invoke on all clients | doesn't make sense?
			throw new Error("Expected a player server id.");
		}

		if (isFunction(args[0])) {
			return serverRegisteringRPCEvent(name, args[0]);
		}

		if (!registeredRPC[name]) {
			throw new Error(`No rpc with that name ${name}`);
		}

		const playerServerId = args[0];

		args = args.splice(1);

		return new Promise((r, e) => {
			const id = _newIdFn();
			const replyName = concatReply(name, id);
			const rpcReplyStub = (result) => {
				removeEventListener(replyName, rpcReplyStub);
				log(`reply from client [${playerServerId}] rpc [${name}] with [${JSON.stringify(result)}] for [${replyName}]`);
				r(result);
			};

			log(`registering client [${playerServerId}] rpc reply handler for [${name}] as [${replyName}]`);
			addNetEventListener(replyName, rpcReplyStub);

			log(`calling rpc client [${playerServerId}] function [${name}](${args.join(", ")})`);
			emitNet(name, playerServerId, id, ...args);
			setTimeout(() => {
				removeEventListener(replyName, rpcReplyStub);
				e(`RPC ${name} invocation is timedout.`);
			}, RPC_TIMEOUT_IN_MS);
		});
	};
}

function clientRegisteringRPCEvent(name, callback) {
	log(`registering client rpc function [${name}]`);
	addNetEventListener(name, async (replyId, ...args) => {
		const result = await callback(...args);
		emitNet(concatReply(name, replyId), result);
	});
	localRegisteredRPCNames[name] = true;
	log(`updating server about the registered rpc function [${name}]`);
	emitNet(localResourceName("rpc:register"), name);
}

function clientRPCRoutine(name) {
	return (...args) => {
		if (isFunction(args[0])) {
			return clientRegisteringRPCEvent(name, args[0]);
		}

		if (!registeredRPC[name]) {
			throw new Error(`No rpc with that name ${name}`);
		}

		return new Promise((r, e) => {
			const id = _newIdFn();
			const replyName = concatReply(name, id);
			const rpcReplyStub = (result) => {
				removeEventListener(replyName, rpcReplyStub);
				log(`reply from server rpc [${name}] with [${JSON.stringify(result)}] for [${replyName}]`);
				r(result);
			};

			log(`registering server rpc reply handler for [${name}] as [${replyName}]`);
			addNetEventListener(replyName, rpcReplyStub);

			log(`calling rpc server function [${name}](${args.join(", ")})`);
			emitNet(name, id, ...args);
			setTimeout(() => {
				removeEventListener(replyName, rpcReplyStub);
				e(`RPC ${name} invocation is timedout.`);
			}, RPC_TIMEOUT_IN_MS);
		});
	};
}


let nativeProxy;
if (isServer) {
	nativeProxy = new Proxy({}, {
		get(target, p, _) {
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
	name = localResourceName(name);
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
		return global[nativeName](...args);
	});
}

if (!isServer) {
	onNet(localResourceName("rpc:names"), function (names) {
		for (const name of names) {
			log(`adding server rpc [${name}]`);
			registeredRPC[name] = true;
		}
	});
	emitNet(localResourceName("rpc:request-rpc-names"));
}

if (isServer) {
	onNet(localResourceName("rpc:request-rpc-names"), function () {
		const playerServerId = global.source;
		emitNet(localResourceName("rpc:names"), playerServerId, Object.keys(localRegisteredRPCNames));
		log(`updating client [${playerServerId}] rpc names [${JSON.stringify(Object.keys(localRegisteredRPCNames))}]`);
	});
}