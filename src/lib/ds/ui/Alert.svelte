<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../utils";

	let {
		title,
		variant = "info",
		class: className = "",
		children
	}: { title?: string; variant?: "info" | "success" | "destructive"; class?: string; children: Snippet } = $props();
</script>

<div
	role={variant === "destructive" ? "alert" : "status"}
	class={cn(
		"text-label motion-safe:duration-base motion-safe:ease-standard rounded-lg p-4 motion-safe:transition-colors",
		variant === "destructive" ? "bg-destructive/20 text-foreground" : "surface-context text-foreground",
		className
	)}
>
	{#if title}<p class="font-semibold">{title}</p>{/if}
	<div class={cn(title && "mt-1", "text-muted-foreground text-pretty")}>{@render children()}</div>
</div>
