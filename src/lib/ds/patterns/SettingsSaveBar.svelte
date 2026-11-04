<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../utils";

	/**
	 * Sticky save bar for a single page-spanning Settings form: status snippet on
	 * the left (Saving… / Saved / hint), action snippet (the submit Cta/Button) on
	 * the right. For pages with multiple INDEPENDENT forms, use an inline footer
	 * row instead — this bar can only submit the one form it lives inside.
	 */
	let {
		status = undefined,
		action,
		class: className = ""
	}: {
		status?: Snippet;
		action: Snippet;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		"surface-context sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-lg p-3 shadow-[var(--elev-float)] backdrop-blur-md",
		className
	)}
>
	<div
		class="text-muted-foreground text-caption flex min-w-0 flex-1 basis-48 flex-wrap items-center gap-2 wrap-anywhere"
	>
		{#if status}{@render status()}{/if}
	</div>
	<div class="ms-auto flex max-w-full min-w-0 flex-wrap items-center gap-2">
		{@render action()}
	</div>
</div>
