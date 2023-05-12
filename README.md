# 5m-js

Helper package for FiveM.

## Installation
### NPM
`npm i 5m-js`

### YARN
`yarn add 5m-js`

## Feature

* Wrap native functions with `setImmediate` to avoid freezing the main
  thread. [Ref](https://docs.fivem.net/docs/scripting-manual/runtimes/javascript/#thread-affinity)
* RPC to invoke functions client/server registered functions.
* RPC to invoke native client functions from server.

## Examples

### JS

#### Wrap natives within callback

```js
require("5m-js/server");

onNet("event-name", async () => {
  const serverId = source;
  const name = await I.GetPlayerName(serverId);
  I.emitNet("event-name", name)
})
```

#### RPC

##### Invoke server registered routine.

server.js

```js
require("5m-js/server");

// calculate will be the rpc name
// when passing function, it will be registered as the rpc routine
rpc.calculate(function (playerServerId, op, x, y) {
  // `playerServerId` will always passed to the rpc routine when registered in server side.
  // And the rest will be the arguments passed to the rpc invocation from client.
  switch (op) {
    case "+":
      return x + y;
    case "-":
      return x - y;
    default:
      return 0;
  }
});

RegisterCommand("get-player-health", async function () {
  const playerServerId = 1;
  // invoking client registered rpc routine from server, playerServerId is the target player
  const health = await rpc.getPlayerHealth(playerServerId)
  console.log(health)
}, true);
```

client.js

```js
require("5m-js/client");
RegisterCommand("calculate-from-server", async function () {
  const r = await rpc.calculate("+", 2, 3);
  console.log(r); // 5
}, false);

// registering rpc routine in clinet to be invoked from server side.
rpc.getPlayerHealth(function () {
  return GetEntityHealth(PlayerPedId())
});
```
##### Invoke client natives directly from server

server.js
```js
require("5m-js/server");

RegisterCommand("kill-all-players", async function() {
  const players = getPlayers();
  for (const p of players) {
    // we need to pass the player server id (source) then the native arguments according to fivem natives.
    const ped = await rpc.native.PlayerPedId(p); 
    await rpc.native.SetEntityHealth(p, ped, 0);
  }
}, true)
```

#### HTTP

##### Perform http request from server

```js
let r = await httpRequest("https://httpbin.org/anything", {
  method: "POST",
  data: "name=5m-js",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  }
})

console.log(
  r.statusCode, r.body, r.headers,
)

r = await httpRequsetJson("https://httpbin.org/anything", {
  method: "POST",
  data: {name: "5m-js"},
  headers: {
    "X-Token": "123"
  }
})

console.log(
  r.statusCode, r.body, r.headers,
)
```


