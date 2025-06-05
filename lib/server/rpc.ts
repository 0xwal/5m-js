type PendingRPCInvocation = {
	resolve: (value: unknown) => void,
	reject: (reason: unknown) => void,
	timeout: NodeJS.Timeout,
	method: string,
	serverId: string | number,
};

type RPCHandler<T> = (serverId: number | string, ...args: any) => Promise<T> | T;

const RESOURCE_NAME = GetCurrentResourceName();
export const MAX_TIMEOUT = GetConvarInt("rpc_timeout", 15 * 1000);

const pendingInvocations = new Map<string, PendingRPCInvocation>();
const remoteRPCs = new Set<string>();
const localRPCs = new Set<string>();

let id = 0;

export function localResourceName(name: string) {
	return `${RESOURCE_NAME}:rpc:${name}`;
}

function isThenable<T>(value: unknown): value is PromiseLike<T> {
	return (
		value !== null &&
		(typeof value === 'object' || typeof value === 'function') &&
		'then' in value &&
		typeof value.then === 'function'
	);
}

function nextId(): string {
	return `${new Date().getTime()}${id++}`
}

const log = (function() {
	const logging = GetConvar("log", "false") === "true";
	if (logging) {
		return (...args: any[]) => console.log("debug:", ...args);
	}
	return () => {
	};
})();

onNet(localResourceName("reply"), async (id: string, result: any) => {
	log(`Received RPC reply for invocation [${id}] with result:`, JSON.stringify(result));
	const invocation = pendingInvocations.get(id);

	if (!invocation) {
		log(`RPC reply for invocation [${id}] not found`);
		throw new Error(`RPC invocation [${id}] not found`);
	}

	clearTimeout(invocation.timeout);
	pendingInvocations.delete(id);

	if (result.ok) {
		log(`RPC method [${invocation.method}] invocation [${id}] for [${invocation.serverId}] succeeded with result:`, JSON.stringify(result.value));
		invocation.resolve(result.value);
	} else {
		log(`RPC method [${invocation.method}] invocation [${id}] for [${invocation.serverId}] failed with error:`, JSON.stringify(result.error));
		invocation.reject(new Error(`Error when executing [${invocation.method}] client [${invocation.serverId}]: ${result.error}`));
	}
});

onNet(localResourceName("register"), async (method: string) => {
	log(`Registering client RPC method [${method}]`);
	remoteRPCs.add(method);
});

onNet(localResourceName("get-names"), async () => {
	const serveId = global.source;
	log(`Emitting RPC names for [${serveId}]`);
	emitNet(localResourceName("names"), serveId, Array.from(localRPCs));
});

export function invoke(method: string, serverId: string | number, ...args: any[]) {
	const promise = new Promise((resolve, reject) => {
		if (!remoteRPCs.has(method)) {
			return reject(new Error(`Invalid RPC method [${method}]`));
		}

		const id = nextId();

		const timeout = setTimeout(() => {
			pendingInvocations.delete(id);
			log(`RPC method [${method}] for [${serverId}] with invocation id [${id}] timed out`);
			reject(new Error(`Timeout when invoking [${method}].`));
		}, MAX_TIMEOUT);

		pendingInvocations.set(id, {
			resolve,
			reject,
			timeout,
			method,
			serverId
		})


		log(`Invoking RPC method [${method}] for [${serverId}] with invocation id [${id}] and args:`, JSON.stringify(args));
		emitNet(localResourceName(method), serverId, id, ...args);
	});

	return promise;
}

export function register<T>(method: string, handler: RPCHandler<T>) {
	log(`Registering RPC handler for [${method}]`);
	const rpcName = localResourceName(method);

	onNet(rpcName, async (id: string, ...args: any[]) => {
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
			emitNet(localResourceName("reply"), serverId, id, { ok: true, value: result })
		} catch (e: any) {
			const message = e?.message ?? e;
			log(`RPC handler for [${method}] failed with error:`, e);
			emitNet(localResourceName("reply"), serverId, id, { ok: false, error: message });
		}
	});
	localRPCs.add(method);
}

export const rpc = new Proxy<any>({}, {
	get(_target, method) {
		return (...args: any[]) => {
			const isFunction = typeof args[0] === "function";
			if (isFunction) {
				return register(method as string, args[0]);
			}

			const serverId = args[0];
			const rest = args.splice(1);

			return invoke(method as string, serverId, ...rest);
		};
	}
});


