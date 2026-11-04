import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./styles/recipes.ts", import.meta.url), "utf8");

test("inputBase owns contextual fill, non-stroke keyboard focus and invalid state", () => {
	for (const value of [
		"field-control",
		"focus-visible:bg-focus-surface",
		"focus-visible:text-focus-foreground",
		"aria-invalid:bg-destructive/20",
		"disabled:cursor-not-allowed"
	])
		assert.ok(source.includes(value), `${value} present in inputBase`);
	assert.doesNotMatch(source, /focus:border|focus-visible:outline|aria-invalid:border/);
});

test("compact field typography is limited to large fine-pointer layouts", async () => {
	for (const path of [
		"styles/recipes.ts",
		"ui/input/input.svelte",
		"ui/textarea/textarea.svelte",
		"ui/Combobox.svelte",
		"ui/MultiSelect.svelte"
	]) {
		const control = await readFile(new URL(`./${path}`, import.meta.url), "utf8");
		assert.match(control, /\btext-base\b/, path);
		assert.match(control, /lg:pointer-fine:text-label/, path);
		assert.doesNotMatch(control, /(?<!pointer-fine:)\b(?:sm|md|lg):text-label/, path);
	}
});
