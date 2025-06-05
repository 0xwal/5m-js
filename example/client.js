import { rpc } from "../lib/client/rpc";

function wait(timeInMS) {
	return new Promise((r) => {
		setTimeout(r, timeInMS);
	});
}

RegisterCommand("test_1", function() {
	rpc.test_1(1, 2, 3);
});

RegisterCommand("test_2", async function() {
	const r = await rpc.test_2(1, 2, 3);
	console.log(r);

	rpc.test_2(1, 2, 3).then(console.log);
	rpc.test_2(5, 6, 7).then(console.log);
});


RegisterCommand("test_3", async function() {
	const r = await rpc.test_3(1, 2, 3);
	console.log(r);

	rpc.test_3(1, 2, 3).then(console.log);
});
