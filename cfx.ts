import { EventEmitter } from "events";
import { install } from "@sinonjs/fake-timers";

const g = globalThis as any;
g.GetCurrentResourceName = () => "testing";
g.GetConvar = () => "dev";
g.GetConvarInt = () => 15 * 1000;


function setup() {
	const ev = new EventEmitter();

	g.onNet = ev.on.bind(ev);
	g.emitNet = ev.emit.bind(ev);
}

g.setup = setup;

g.clock = install()

setup();
