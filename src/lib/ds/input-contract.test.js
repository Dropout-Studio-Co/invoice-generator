import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const recipes = await readFile(new URL("./styles/recipes.ts", import.meta.url), "utf8");
const tokens = await readFile(new URL("./styles/tokens.css", import.meta.url), "utf8");
const textarea = await readFile(new URL("./ui/textarea/textarea.svelte", import.meta.url), "utf8");
const inputGroup = await readFile(
	new URL("./ui/input-group/input-group.svelte", import.meta.url),
	"utf8"
);

/** @param {string} name */
const recipe = (name) =>
	recipes.match(new RegExp(`export const ${name} =\\s*"([^"]+)"`))?.[1] ?? "";

/**
 * Class-tier specificity of a `field-entry` selector: `:where()` contributes
 * nothing, `:is()`/`:not()`/`:has()` contribute their most specific argument.
 * @param {string} selector
 */
const classWeight = (selector) => {
	let weight = 0;
	for (let index = 0; index < selector.length;) {
		const character = selector[index];
		if (character === "&" || character === ".") {
			weight += 1;
			index += 1;
		} else if (character === "[") {
			weight += 1;
			index = selector.indexOf("]", index) + 1;
		} else if (character === ":") {
			const functional = selector.slice(index).match(/^:([\w-]+)\(/);
			if (!functional) {
				weight += 1;
				index += 1;
				continue;
			}
			const open = index + functional[0].length;
			let depth = 1;
			let end = open;
			while (depth > 0) {
				if (selector[end] === "(") depth += 1;
				else if (selector[end] === ")") depth -= 1;
				if (depth > 0) end += 1;
			}
			if (functional[1] !== "where")
				weight += Math.max(
					...selector
						.slice(open, end)
						.split(",")
						.map((argument) => classWeight(argument))
				);
			index = end + 1;
		} else index += 1;
	}
	return weight;
};

test("inputBase owns the text-entry contract without inverted focus", () => {
	const inputBase = recipe("inputBase");
	assert.ok(inputBase.length > 0, "inputBase exists");
	for (const value of [
		"field-control",
		"field-entry",
		"aria-invalid:bg-destructive/20",
		"disabled:cursor-not-allowed"
	])
		assert.ok(inputBase.includes(value), `${value} present in inputBase`);
	assert.doesNotMatch(inputBase, /focus-visible:bg-focus-surface/);
	assert.doesNotMatch(inputBase, /focus-visible:text-focus-foreground/);
	assert.doesNotMatch(inputBase, /focus:border|focus-visible:outline|aria-invalid:border/);
});

test("selectBase keeps the fill-focus law for select triggers", () => {
	const selectBase = recipe("selectBase");
	assert.ok(selectBase.length > 0, "selectBase exists");
	assert.ok(selectBase.includes("focus-visible:bg-focus-surface"));
	assert.ok(selectBase.includes("focus-visible:text-focus-foreground"));
	assert.ok(!selectBase.includes("field-entry"));
});

test("field-entry is the single text-entry state block", () => {
	const [block = ""] = tokens.match(/@utility field-entry \{([\s\S]*?)\n\}/) ?? [];
	assert.ok(block.length > 0, "field-entry utility exists");
	for (const declaration of [
		"caret-color: currentColor",
		"color: var(--muted-foreground)",
		"background-color: var(--ds-control-hover)",
		"color: var(--foreground)",
		"box-shadow: inset 0 0 0 2px var(--ring)",
		"box-shadow: inset 0 0 0 2px var(--destructive)",
		"-webkit-text-fill-color: var(--foreground)",
		"box-shadow: inset 0 0 0 1000px var(--ds-control-background)",
		"inset 0 0 0 1000px var(--ds-control-hover)",
		"color-mix(in oklab, var(--destructive) 20%, var(--ds-control-background))",
		"color-mix(in oklab, var(--destructive) 20%, var(--ds-control-hover))",
		"background-color: Field",
		"color: FieldText",
		"outline: 3px solid CanvasText",
		"outline-offset: -3px"
	])
		assert.ok(block.includes(declaration), `${declaration} present in field-entry`);
	assert.doesNotMatch(block, /--focus-surface|--focus-foreground/);
});

test("disabled text entry never takes the hover fill", () => {
	const [block = ""] = tokens.match(/@utility field-entry \{([\s\S]*?)\n\}/) ?? [];
	const hover = '&:where(:hover:not(:disabled, [aria-disabled="true"]))';
	assert.ok(block.includes(hover), "the guarded hover rule exists");
	assert.equal(
		classWeight(hover),
		classWeight("&"),
		"the hover rule matches at .field-entry specificity so the invalid tint and disabled fill outrank it"
	);
	assert.match(
		block,
		/&:where\(:-webkit-autofill\):hover:where\(:not\(:disabled, \[aria-disabled="true"\]\)\)/
	);
	assert.match(
		block,
		/&\[data-slot="input-otp-slot"\]:where\(:hover:not\(:disabled, \[aria-disabled="true"\]\)\)/
	);
	assert.match(
		block,
		/&:has\(> \[data-slot="input-group-control"\]\):where\(\s*:hover:not\(:disabled, \[aria-disabled="true"\]\)\s*\)/
	);
	assert.equal(
		classWeight(
			'&[data-slot="input-otp-slot"]:where(:hover:not(:disabled, [aria-disabled="true"]))'
		),
		classWeight("&") + 1,
		"the surface-control consumer re-adds one unit to outrank its rest fill"
	);
});

test("invalid autofill focus outranks the plain invalid ring instead of dying behind it", () => {
	const [block = ""] = tokens.match(/@utility field-entry \{([\s\S]*?)\n\}/) ?? [];
	const invalidFocus = '&[aria-invalid="true"]:is(:focus, :focus-visible)';
	const invalidAutofillFocus =
		'&[aria-invalid="true"]:where(:-webkit-autofill):is(:focus, :focus-visible)';
	assert.ok(block.includes(invalidFocus), "the plain invalid ring rule exists");
	assert.ok(block.includes(invalidAutofillFocus), "the invalid autofill focus rule exists");
	assert.ok(
		classWeight(invalidAutofillFocus) >= classWeight(invalidFocus),
		"the invalid autofill rule matches at least the plain ring's specificity, so its later position wins"
	);
	assert.ok(
		block.indexOf(invalidAutofillFocus) > block.indexOf(invalidFocus),
		"the invalid autofill focus rule comes after the plain invalid ring"
	);
	const start = block.indexOf(invalidAutofillFocus);
	const declaration = block.slice(start, block.indexOf("\n\t}", start));
	assert.match(declaration, /inset 0 0 0 2px var\(--destructive\)/);
	assert.match(declaration, /inset 0 0 0 1000px color-mix/);
});

test("the InputGroup inner control never draws its own ring, fill or outline", () => {
	const [block = ""] = tokens.match(/@utility field-entry \{([\s\S]*?)\n\}/) ?? [];
	const inner = '[data-slot="input-group"] > &[data-slot="input-group-control"]';
	const innerHover = `${inner}:where(:hover)`;
	const innerAutofill = `${inner}:where(:-webkit-autofill)`;
	const innerFocus = `${inner}:is(:focus, :focus-visible)`;
	assert.ok(block.includes(innerHover), "the inner hover reset exists");
	assert.ok(block.includes(innerFocus), "the inner focus reset exists");
	assert.ok(
		classWeight(innerHover) > classWeight('&:where(:hover:not(:disabled, [aria-disabled="true"]))'),
		"the inner hover reset outranks the hover fill"
	);
	assert.ok(
		classWeight(innerAutofill) >= classWeight(inner) &&
			block.indexOf(innerAutofill) > block.indexOf(inner),
		"the inner autofill patch matches the inner reset's specificity and follows it"
	);
	assert.ok(block.includes("outline: none"), "the inner resets clear any outline");
});

test("forced colors map text entry natively instead of inverting it", () => {
	const forced = tokens.slice(tokens.indexOf("--ds-control-hover: Highlight;"));
	assert.ok(forced.length > 0, "forced-colors token block exists");
	assert.ok(
		forced.includes(".field-control:not(.field-entry)"),
		"text entry is excluded from the Highlight fill"
	);
	assert.match(forced, /:where\(\.field-entry\)[\s\S]*?background-color: Field/);
	assert.match(
		forced,
		/:where\(\.field-entry\):is\(:focus, :focus-visible\):not\(\[data-slot="input-group-control"\]\)/
	);
	assert.match(
		forced,
		/:where\(\.field-entry\):not\(\[data-slot="input-group-control"\], \[aria-invalid="true"\]\)\s*\{\s*outline: 1px solid CanvasText;\s*outline-offset: -1px/
	);
	assert.ok(
		forced.indexOf("outline: 1px solid CanvasText") <
			forced.indexOf("outline: 3px solid CanvasText"),
		"the rest boundary precedes the thicker focus outline"
	);
	assert.match(forced, /outline: 3px solid CanvasText/);
	assert.match(forced, /\.field-entry::placeholder \{\s*color: GrayText/);
	assert.match(forced, /\.field-entry\[aria-invalid="true"\]::placeholder \{\s*color: MarkText/);
	assert.match(
		forced,
		/:where\(\.field-entry\):is\(:disabled,\s*\[aria-disabled="true"\]\)[\s\S]{0,400}?background-color: Field;\s*color: GrayText/
	);
	assert.match(
		forced,
		/:where\(\.field-entry\):has\(> \[data-slot="input-group-control"\]:disabled\)/
	);
	assert.match(forced, /outline: 1px solid GrayText/);
	assert.match(
		forced,
		/\[data-slot="input-group"\] > \[data-slot="input-group-control"\]:is\(:focus, :focus-visible\) \{\s*outline: none/
	);
	assert.match(
		forced,
		/\[data-slot="input-group"\] > \[data-slot="input-group-control"\]:disabled \{\s*color: GrayText/
	);
});

test("the generic inverted-fill rule excludes text-entry controls", () => {
	const [exclusion = ""] =
		tokens.match(/:where\(\.field-control, \[data-slot\]\):focus-visible:not\(([\s\S]*?)\)\s*\{/) ??
		[];
	assert.ok(exclusion.includes(".field-entry"), "text entry is excluded from fill focus");
	assert.ok(
		exclusion.includes('[data-slot="input-group"]'),
		"InputGroup is excluded from fill focus"
	);
	assert.ok(
		exclusion.includes('[data-slot="input-otp-slot"]'),
		"InputOTP cells are excluded from fill focus"
	);
	assert.doesNotMatch(tokens, /:focus-visible::placeholder\s*\{[^}]*--focus-foreground/);
});

test("text-entry components consume field-entry instead of repeating focus classes", () => {
	/** @type {readonly [readonly [string, string], readonly [string, string]]} */
	const textEntrySources = [
		["Textarea", textarea],
		["InputGroup", inputGroup]
	];
	for (const [name, source] of textEntrySources) {
		assert.ok(source.includes("field-entry"), `${name} consumes field-entry`);
		assert.doesNotMatch(
			source,
			/focus-visible:bg-focus-surface|focus-visible:text-focus-foreground/,
			`${name} never inverts its typing surface`
		);
	}
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
