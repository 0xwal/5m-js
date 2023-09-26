// noinspection JSUnresolvedFunction,JSUnresolvedVariable

function wait(timeInMS) {
  return new Promise((r) => {
    setTimeout(r, timeInMS);
  });
}

rpc.client_demo(async function (a, b) {
  return {a, b};
});

rpc.client_that_takes_long(async function (a, b) {
  await wait(13 * 1000);
  return ["it works", a, b];
});


RegisterCommand("invoke_server_rpc", async function () {
  const r = await rpc.server_demo(1, 2, 3);
  console.log(r);
});

RegisterCommand("invoke_server_long_rpc", async function () {
  const r = await rpc.server_that_takes_long(1, 2, 3);
  console.log(r)
});

RegisterCommand("invoke_invalid_rpc", async function() {
  await rpc.non_existing(1, 2, 3);
});


RegisterCommand("invoke_invalid_server_rpc", async function () {
  const r = await rpc.invalid_server_id(1, 2, 3);
  console.log(r);
});