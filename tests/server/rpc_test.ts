import { expect, test, beforeEach, setDefaultTimeout } from "bun:test";

let rpcModule: any = null;

setDefaultTimeout(1000);


beforeEach(async () => {
	global.source = undefined;
	clock.reset();
	setup();
	delete require.cache[require.resolve("../../lib/server/rpc")];
	rpcModule = require("../../lib/server/rpc")


	const originalEmitNet = global.emitNet;
	global.emitNet = (name: string, serverId: string | number, ...args: any[]) => {
		global.source = serverId;
		originalEmitNet(name, ...args);
	}
})

test("can invoke rpc", done => {
	emitNet(rpcModule.localResourceName("register"), -1, "testing");
	rpcModule.register("testing", (serverId, a, b, c) => {
		expect([serverId, a, b, c]).toEqual([55, 1, 2, 3]);
		done()
	});

	rpcModule.invoke("testing", 55, 1, 2, 3);
});

test("can invoke multiple rpc", done => {
	emitNet(rpcModule.localResourceName("register"), -1, "testing");
	const results: number[][] = [];

	rpcModule.rpc.testing((serverId, a, b, c) => {
		results.push([serverId, a, b, c])
	});

	rpcModule.invoke("testing", 55, 1, 2, 3);
	rpcModule.rpc.testing(66, 4, 5, 6);

	expect(results).toEqual([[55, 1, 2, 3], [66, 4, 5, 6]]);
	done()
});

test("can return result", done => {
	emitNet(rpcModule.localResourceName("register"), -1, "testing");
	rpcModule.register("testing", (serverId, a, b) => {
		expect(serverId).toBe(55);
		return a + b;
	});

	rpcModule.invoke("testing", 55, 1, 2).then((r) => {
		expect(r).toBe(3);
		done()
	});

});

test("can return result as an object", done => {
	emitNet(rpcModule.localResourceName("register"), -1, "testing");
	rpcModule.register("testing", (serverId, a: number, b: number) => {
		expect(serverId).toBe(99);
		return { result: a + b };
	});

	rpcModule.invoke("testing", 99, 1, 2).then((r: any) => {
		expect(r).toEqual({ result: 3 });
		done()
	});

});

test("rpc handler can be a promise", done => {
	emitNet(rpcModule.localResourceName("register"), -1, "testing");
	rpcModule.register("testing", async (serverId, a: number, b: number) => {
		await new Promise(r => setTimeout(r, 4000));
		return { result: a + b, serverId };
	});

	rpcModule.invoke("testing", 88, 1, 2).then((r: any) => {
		expect(r).toEqual({ result: 3, serverId: 88 });
		done()
	});

	clock.tick(4000);
});


test("invoking invalid rpc", done => {
	rpcModule.invoke("testing", 1, 2, 3).catch((e: any) => {
		expect(e.message).toBe(`Invalid RPC method [testing]`)
		done()
	});

	clock.tick(0);
});

test("it can handle when rpc stub throw Error", done => {
	emitNet(rpcModule.localResourceName("register"), -1, "testing");
	rpcModule.register("testing", async (serverId) => {
		expect(serverId).toBe(77)
		throw new Error("got an error");
	});


	rpcModule.invoke("testing", 77).catch((e) => {
		expect(e.message).toBe(`Error when executing [testing] client [77]: got an error`)
		done()
	});
});

test("it can handle when rpc stub throw string", done => {
	emitNet(rpcModule.localResourceName("register"), -1, "testing");
	rpcModule.register("testing", () => {
		throw "got an error";
	});


	rpcModule.invoke("testing", 77).catch((e) => {
		expect(e.message).toBe("Error when executing [testing] client [77]: got an error")
		done()
	});
});


test("ability to emit all rpc names", done => {
	rpcModule.register("testing1", () => { });

	rpcModule.register("testing2", () => { });

	rpcModule.register("testing3", () => { });

	// client
	onNet(rpcModule.localResourceName("names"), (names) => {
		expect(names).toEqual(["testing1", "testing2", "testing3"]);
		done()
	});

	// emitting from client to server
	emitNet(rpcModule.localResourceName("get-names"), -1);

});
