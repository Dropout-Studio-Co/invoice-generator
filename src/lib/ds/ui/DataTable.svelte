<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../utils";

	let { caption, class: className = "", children }: { caption: string; class?: string; children: Snippet } = $props();
</script>

<!-- eslint-disable-next-line svelte/no-unused-svelte-ignore -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="surface-context w-full overflow-x-auto rounded-lg"
	tabindex="0"
	role="region"
	aria-label={`${caption} table, horizontally scrollable when needed`}
>
	<table
		class={cn("min-w-table text-label w-full border-separate border-spacing-0 text-start tabular-nums", className)}
	>
		<caption class="sr-only">{caption}</caption>
		{@render children()}
	</table>
</div>
