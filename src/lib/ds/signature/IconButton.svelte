<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import Button from "../ui/button/button.svelte";

	type Props = HTMLButtonAttributes &
		HTMLAnchorAttributes & {
			tone?: "default" | "destructive";
			href?: string | undefined;
			class?: string;
			children: Snippet;
		};

	let { tone = "default", href, type = "button", class: className = "", children, ...rest }: Props = $props();
</script>

<Button
	{href}
	{type}
	variant="icon"
	class={cn(
		"sleek group surface-control motion-safe:duration-fast motion-safe:ease-standard cursor-pointer backdrop-blur-sm motion-safe:transition-colors",
		tone === "destructive" && "pointer-fine:hover:bg-destructive/10 pointer-fine:hover:text-destructive",
		className
	)}
	{...rest}
>
	{@render children()}
</Button>
