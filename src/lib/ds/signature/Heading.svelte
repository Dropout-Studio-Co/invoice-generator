<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../utils";

	type Size = "display" | "title-lg" | "title" | "title-sm" | "subtitle" | "lead";

	/**
	 * Variable-weight heading. Drives the `opsz` + `wght` axes inline so weight
	 * can animate. The weight law is encoded: capped at 600 for text; the 700
	 * tier is reserved for display numerals (opt in with `numeral`).
	 *
	 * Sizes resolve to the `--text-*` tokens, which are FLUID for `subtitle`→
	 * `display` — so every heading is responsive with no breakpoint classes.
	 *
	 * Canonical weights (keep products consistent): page-title H1 → 600; every
	 * other heading → the 540 default. Don't pass 560/580 one-offs.
	 */
	let {
		children,
		as = "h2",
		size = "title",
		weight = 540,
		opsz = 120,
		numeral = false,
		class: className = ""
	}: {
		children: Snippet;
		as?: string;
		size?: Size;
		weight?: number;
		opsz?: number;
		numeral?: boolean;
		class?: string;
	} = $props();

	const sizeClass: Record<Size, string> = {
		display: "text-display",
		"title-lg": "text-title-lg",
		title: "text-title",
		"title-sm": "text-title-sm",
		subtitle: "text-subtitle",
		lead: "text-lead"
	};

	const safeWeight = $derived(Math.min(weight, numeral ? 700 : 600));
	const style = $derived(
		`font-weight: ${safeWeight}; font-variation-settings: 'opsz' ${opsz}, 'wght' ${safeWeight};`
	);
</script>

<svelte:element
	this={as}
	class={cn(sizeClass[size], "leading-heading text-foreground min-w-0 text-balance wrap-anywhere", className)}
	{style}
>
	{@render children()}
</svelte:element>
