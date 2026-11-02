// Vite build config. Tailwind v4 is wired CSS-first through @tailwindcss/vite — there is
// no tailwind.config.js; theme tokens live in src/app.css under @theme. The es2022 build
// target matches the Node/Worker runtime floor declared in package.json engines.
//
// Vitest shares this config so unit tests resolve the same `$lib`/`$src` aliases and
// Svelte preprocessing as the app. `include` is deliberately narrow: the vendored
// `src/lib/ds/*.test.js` files are plain `node:test` scripts (`bun run test:ds`), not
// Vitest suites, and must keep running on the Node test runner.
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		target: "es2022"
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"]
	}
});
