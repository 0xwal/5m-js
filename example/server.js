// noinspection JSUnresolvedFunction,JSUnresolvedVariable

rpc.server_demo(async function () {
  await new Promise(r => setTimeout(r, 3000));
  return "I am from server";
});


RegisterCommand("invoke_client_rpc", async function (source, args) {
  rpc.client_demo(args[0], 2, 3).then(console.log);
  const r = await rpc.client_demo(args[0], 4, 5);
  console.log(r, ": value returned from client");
});


RegisterCommand("invoke_client_native", async function (source, ...args) {
  const a = await rpc.native.PlayerPedId(10);
  const r = await rpc.native.SetEntityHealth(10, a, 0);
  console.log(r, ": value returned from client");
});


RegisterCommand("invoke_http_request", async function () {
  const r = await httpRequest("https://httpbin.org/anything", {
    method: "POST",
    data: "name=Waleed", //JSON.stringify({ name: "Waleed" }),
    headers: {
      // "Content-Type": "application/json"
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  console.log(r.statusCode);
  console.log(r.headers);
  console.log(r.body);
});


RegisterCommand("invoke_http_json_request", async function () {
  const r = await httpRequestJson("https://httpbin.org/anything", {
    method: "POST",
    data: { name: "Waleed" }
  });

  console.log(r.statusCode);
  console.log(r.headers);
  console.log(r.body);
});