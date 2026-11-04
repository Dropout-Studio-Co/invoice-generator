<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../utils";
	import { labelBase, helperBase } from "../styles/recipes";

	/**
	 * One settings field row. Label and control share a row while both have
	 * a readable 15rem allocation; otherwise they wrap against their container.
	 * The label keeps its alignment and the control fills the remaining space.
	 * Use `stacked` for genuinely full-width
	 * inputs (API tokens, IDs): single column at every width, control below label.
	 * Controls passed as children should be `w-full`.
	 */
	let {
		label,
		hint = undefined,
		htmlFor = undefined,
		stacked = false,
		class: className = "",
		children
	}: {
		label: string;
		hint?: string;
		htmlFor?: string;
		stacked?: boolean;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class={cn("flex gap-x-8 gap-y-2.5", stacked ? "flex-col" : "flex-wrap items-center", className)}>
	<div class={cn("flex min-w-0 flex-col gap-1 wrap-anywhere", !stacked && "basis-60")}>
		<label for={htmlFor} class={cn(labelBase, "mb-0")}>{label}</label>
		{#if hint}
			<span class={cn(helperBase, "text-muted-foreground")}>{hint}</span>
		{/if}
	</div>
	<div class={cn("w-full min-w-0", !stacked && "flex-1 basis-60")}>
		{@render children()}
	</div>
</div>
