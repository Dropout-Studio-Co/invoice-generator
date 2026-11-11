import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("./styles/tokens.css", import.meta.url), "utf8");
const content = await readFile(new URL("./ui/tabs/tabs-content.svelte", import.meta.url), "utf8");

test("Tabs content opts into rich-content focus without panel or descendant inversion", () => {
	assert.match(content, /data-focus-container/);
	assert.doesNotMatch(content, /focus-visible:(?:bg|text)-/);
	assert.match(content, /TabsPrimitive\.Content/);
	assert.match(content, /bind:ref/);
	assert.match(content, /\.\.\.restProps/);
	assert.doesNotMatch(content, /tabindex=|role=|onfocus|onkeydown/);
});

test("container focus has a reserved solid sticky marker, not a descendant focus sweep", () => {
	const marker = css.match(/\[data-focus-container\]::before\s*\{([^}]+)\}/)?.[1];
	assert.ok(marker);
	for (const declaration of [
		"position: sticky",
		"inset-block-start: 0",
		"inline-size: 1rem",
		"block-size: 1rem",
		"background-color: var(--foreground)",
		"opacity: 0",
		"transition: none",
		"forced-color-adjust: auto"
	])
		assert.ok(marker.includes(declaration), declaration);
	assert.doesNotMatch(marker, /outline|border|box-shadow|forced-color-adjust: none/);
	assert.match(css, /\[data-focus-container\]\s*\{\s*padding-inline-start: 1\.5rem;/);
	assert.match(css, /:has\(> \[data-focus-container-target\]:focus-visible\)/);
	assert.doesNotMatch(css, /\[data-focus-container\][^{}]*:focus-within/);
	const paintRules = [
		...css.matchAll(
			/([^{}]+)\{[^{}]*background-color: (?:var\(--focus-(?:button-)?surface\)|CanvasText)/g
		)
	];
	assert.ok(paintRules.length >= 3);
	for (const match of paintRules) {
		const selector = match[1];
		if (!selector || !selector.includes(":focus-visible")) continue;
		assert.ok(
			selector
				.replace(/\s+/g, "")
				.includes(":not([data-focus-container],[data-focus-container-target]"),
			selector
		);
	}
	assert.doesNotMatch(css, /\[role=["']?tabpanel[^{}]*\{/);
});
