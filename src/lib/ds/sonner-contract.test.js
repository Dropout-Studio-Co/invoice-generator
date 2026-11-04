import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const { cn } = await import(new URL("./utils.ts", import.meta.url).href);

/** Vendored components must not resolve through a product's utility barrel. */
test("vendored Sonner owns its semantic class merger", () => {
	const source = readFileSync(new URL("./ui/sonner/sonner.svelte", import.meta.url), "utf8");
	assert.match(source, /import \{ cn \} from "\.\.\/\.\.\/utils"/);
	assert.doesNotMatch(source, /from ["']\$lib/);
	const result = cn("surface-modal rounded-lg text-popover-foreground shadow-lg", "text-caption");
	assert.ok(result.split(" ").includes("text-popover-foreground"));
	assert.ok(result.split(" ").includes("text-caption"));
});
