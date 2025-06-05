await Bun.build({
	entrypoints: ["./example/server.js"],
	outdir: "./example/dist",
	target: "node",
	format: "cjs",
});

await Bun.build({
	entrypoints: ["./example/client.js"],
	outdir: "./example/dist",
	target: "node",
	format: "cjs",
});

{
	const file = await Bun.file("./example/fxmanifest.lua");
	await Bun.write("./example/dist/fxmanifest.lua", file);
}
