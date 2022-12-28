// noinspection JSUnresolvedFunction,JSUnresolvedVariable

rpc.server_demo(async function () {
  await new Promise(r => setTimeout(r, 3000))
  return "I am from server";
});


RegisterCommand("invoke_client_rpc", async function (source, args) {
  rpc.client_demo(args[0], 2, 3).then(console.log);
  const r = await rpc.client_demo(args[0], 4, 5);
  console.log(r, ": value returned from client");
});


RegisterCommand("invoke_client_native", async function (source, ...args) {
  const a = await rpc.native.PlayerPedId(10);
  const r = await rpc.native.SetEntityHealth(10, a, 0)
  console.log(r, ": value returned from client");
});
