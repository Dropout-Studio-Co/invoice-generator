<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../utils";

	let {
		title,
		description,
		action,
		class: className = ""
	}: { title: string; description?: string; action?: Snippet; class?: string } = $props();
</script>

<section
	class={cn("surface-context flex min-h-48 flex-col items-start justify-center gap-3 rounded-lg p-6", className)}
>
	<h2 class="text-title-sm leading-heading max-w-full font-medium text-balance wrap-anywhere">{title}</h2>
	{#if description}<p class="text-label text-muted-foreground max-w-prose text-pretty">{description}</p>{/if}
	{#if action}<div class="mt-2">{@render action()}</div>{/if}
</section>
