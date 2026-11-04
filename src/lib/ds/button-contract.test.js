import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./ui/button/button.svelte", import.meta.url), "utf8");
const ctaSource = await readFile(new URL("./signature/Cta.svelte", import.meta.url), "utf8");
const tokenSource = await readFile(new URL("./styles/tokens.css", import.meta.url), "utf8");

test("Button owns the complete shared presentation contract", () => {
	for (const value of [
		"primary",
		"secondary",
		"outline",
		"ghost",
		"destructive",
		"icon",
		"nav",
		"text-button leading-5",
		"gap-2",
		"min-h-9 px-3 py-1 text-caption",
		"min-h-10 px-4 py-1",
		"min-h-11 px-7 py-2",
		"hover:no-underline",
		"focus:no-underline",
		"active:no-underline",
		"visited:no-underline"
	])
		assert.match(source, new RegExp(value));
});

test("Button lets long labels shrink inside narrow containers", () => {
	assert.match(source, /text-center wrap-anywhere/);
	assert.doesNotMatch(source, /break-words/);
});

test("Button hover preserves physical size across variants while retaining visual feedback", () => {
	assert.doesNotMatch(
		source,
		/(?:hover|group-hover|peer-hover):(?:scale|zoom)-|(?:hover|group-hover|peer-hover):[^\s"']*scale/
	);
	assert.match(
		source,
		/default:\s*"[^"]*primary-fill-wipe[^"]*hover:text-primary-hover-foreground/
	);
	assert.match(
		source,
		/primary:\s*"[^"]*primary-fill-wipe[^"]*hover:text-primary-hover-foreground/
	);
	assert.match(source, /focus-visible:bg-focus-button-surface!/);
	assert.doesNotMatch(source, /hover:shadow|focus-visible:(?:outline|ring)|active:scale/);
	assert.match(source, /secondary: "surface-control text-foreground hover:surface-control-hover"/);
});

test("Cta primary keeps semantic hover fill, motion timing, and arrow ownership", () => {
	for (const value of [
		"hover:text-primary-hover-foreground",
		"motion-safe:duration-editorial",
		"motion-safe:ease-interaction",
		"../icons/moving/ArrowUpRight.svelte",
		'data-icon="inline-end"'
	])
		assert.ok(ctaSource.includes(value), `missing ${value}`);
	assert.doesNotMatch(ctaSource, /data-cta-sheen|data-cta-fill/);
	assert.match(tokenSource, /@utility primary-fill-wipe/);
	assert.match(tokenSource, /&:focus-visible::before/);
	assert.match(tokenSource, /:where\(\.field-control, \[data-slot\]\):focus-visible/);
	assert.doesNotMatch(tokenSource, /(?:^|\n)\s*:focus-visible\s*\{/);
	assert.match(tokenSource, /prefers-reduced-motion: reduce/);
	assert.match(tokenSource, /@utility ease-interaction/);
});

test("Button keeps native and inert-link behavior", () => {
	assert.match(source, /type = "button"/);
	assert.match(source, /onclick\?\.\(event\)/);
	assert.match(source, /href=\{inactive \? undefined : href\}/);
	assert.match(source, /tabindex=\{inactive \? -1 : tabindex\}/);
	assert.match(source, /aria-busy=\{loading \|\| undefined\}/);
	assert.match(source, /disabled=\{inactive\}/);
	assert.match(source, /<button[\s\S]*tabindex=\{inactive \? -1 : tabindex\}/);
	assert.match(source, /<button[\s\S]*\{onclick\}[\s\S]*class=/);
});
