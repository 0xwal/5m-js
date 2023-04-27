// noinspection JSUnresolvedFunction,JSUnresolvedVariable

require('5m-js');

rpc.client_demo(async function (a, b) {
  return {a, b};
});

RegisterCommand("invoke_server_rpc", async function () {
  const r = await rpc.server_demo(1, 2, 3);
  console.log(r);
});

RegisterCommand("invoke_invalid_server_rpc", async function () {
  const r = await rpc.invalid_server_id(1, 2, 3);
  console.log(r);
});