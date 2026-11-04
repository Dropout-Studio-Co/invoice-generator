<script lang="ts">
	import { cn } from "../utils";

	/**
	 * Connection status pill — the one "Connected / Not connected" badge, site-wide.
	 * An uppercase pill with a leading dot: the `status-connected` functional mint
	 * when connected, muted ink otherwise. The pill keeps its hairline (it's a badge,
	 * not a button); the mint is the single sanctioned functional accent for live status,
	 * one value across every tool so equivalent badges match exactly.
	 */
	let {
		label,
		tone = "neutral",
		class: className = ""
	}: {
		label: string;
		tone?: "neutral" | "connected" | "disconnected";
		class?: string;
	} = $props();
</script>

<span
	class={cn(
		"text-caption inline-flex max-w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-center leading-4 tracking-[0.08em] whitespace-normal uppercase",
		tone === "connected" ? "bg-status-connected/20 text-foreground" : "surface-control text-muted-foreground",
		className
	)}
>
	<span class={cn("size-1.5 rounded-full", tone === "connected" ? "bg-status-connected" : "bg-ink-muted")}></span>
	{label}
</span>
