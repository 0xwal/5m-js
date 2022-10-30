# 5m-js
Helper package for FiveM.

## Feature
* Wrap native functions with `setImmediate` to avoid freezing the main thread. [Ref](https://docs.fivem.net/docs/scripting-manual/runtimes/javascript/#thread-affinity)


## Example
### JS
```js
require("5m-js");

onNet("event-name", async () => {
  const serverId = source;
  const name = await I.GetPlayerName(serverId);
  I.emmitNet("event-name", name)
})
```
