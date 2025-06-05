import { expect, test, beforeEach, setDefaultTimeout } from "bun:test";

let rpcModule: any = null;

setDefaultTimeout(1000);

beforeEach(async () => {
	clock.reset();
	setup();
	delete require.cache[require.resolve("../../lib/client/rpc")];
	rpcModule = require("../../lib/client/rpc")
})

test("can invoke rpc", done => {
	rpcModule.register("testing", (a, b, c) => {
		expect([a, b, c]).toEqual([1, 2, 3]);
		done()
	});

	rpcModule.invoke("testing", 1, 2, 3);
});

test.only("can invoke multiple rpc", done => {
	const results: number[][] = [];

	rpcModule.rpc.testing((a, b, c) => {
		results.push([a, b, c])
	});

	rpcModule.invoke("testing", 1, 2, 3);
	rpcModule.rpc.testing(4, 5, 6);

	expect(results).toEqual([[1, 2, 3], [4, 5, 6]]);
	done()
});

test("can return result", done => {
	rpcModule.register("testing", (a, b) => {
		return a + b;
	});

	rpcModule.invoke("testing", 1, 2).then((r) => {
		expect(r).toBe(3);
		done()
	});

});

test("can return result as an object", done => {
	rpcModule.register("testing", (a: number, b: number) => {
		return { result: a + b };
	});

	rpcModule.invoke("testing", 1, 2).then((r: any) => {
		expect(r).toEqual({ result: 3 });
		done()
	});

});

test("rpc handler can be a promise", done => {
	rpcModule.register("testing", async (a: number, b: number) => {
		await new Promise(r => setTimeout(r, 4000));
		return { result: a + b };
	});

	rpcModule.invoke("testing", 1, 2).then((r: any) => {
		expect(r).toEqual({ result: 3 });
		done()
	});

	clock.tick(4000);
});


test("invoking invalid rpc", done => {
	rpcModule.invoke("testing", 1, 2, 3).catch((e: any) => {
		expect(e.message).toBe(`Timeout when invoking [testing].`)
		done()
	});

	clock.tick(rpcModule.MAX_TIMEOUT);
});

test("it can handle when rpc stub throw Error", done => {
	rpcModule.register("testing", async () => {
		throw new Error("got an error");
	});


	rpcModule.invoke("testing", 1, 2, 3).catch((e) => {
		expect(e.message).toBe(`Error when executing [testing]: got an error`)
		done()
	});
});

test("it can handle when rpc stub throw string", done => {
	rpcModule.register("testing", () => {
		throw "got an error";
	});


	rpcModule.invoke("testing", 1, 2, 3).catch((e) => {
		expect(e.message).toBe(`Error when executing [testing]: got an error`)
		done()
	});
});
