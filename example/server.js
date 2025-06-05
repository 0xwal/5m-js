import { rpc } from "../lib/server/rpc";

function wait(timeInMS) {
	return new Promise((r) => {
		setTimeout(r, timeInMS);
	});
}

rpc.test_1(async (serverId, ...args) => {
});

rpc.test_2((serverId, ...args) => {
	return ["test_2 returned", ...args];
});

rpc.test_3(async (serverId, ...args) => {

	await wait(1000);

	return ["test_3 returned", ...args];
});


rpc.$test_4(async (serverId, ...args) => {
	await wait(3000);
	console.log("invoked");
});

