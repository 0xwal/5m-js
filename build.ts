import { BuildConfig } from "bun"

const defaultBuildConfig: BuildConfig = {
  entrypoints: [
		"./lib/client.ts",
		"./lib/server.ts",

	],
  outdir: './dist'
}

Bun.$`rm -rf dist`;
await Promise.all([
  Bun.build({
    ...defaultBuildConfig,
    format: 'esm',
    naming: "[dir]/[name].js",
  }),
  Bun.build({
    ...defaultBuildConfig,
    format: 'cjs',
    naming: "[dir]/[name].cjs",
  })
])

