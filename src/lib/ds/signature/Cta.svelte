<script lang="ts">
	import ArrowUpRight from "../icons/moving/ArrowUpRight.svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import Button from "../ui/button/button.svelte";

	type Props = HTMLButtonAttributes &
		HTMLAnchorAttributes & {
			variant?: "primary" | "secondary" | "compact";
			size?: "md" | "sm";
			href?: string | undefined;
			loading?: boolean;
			arrow?: boolean;
			dot?: boolean;
			class?: string;
			children: Snippet;
		};

	let {
		variant = "primary",
		size = "md",
		href,
		loading = false,
		arrow = true,
		dot = false,
		type = "button",
		class: className = "",
		children,
		...rest
	}: Props = $props();

	const foundationSize = $derived(variant === "compact" ? "sm" : size === "sm" ? "md" : "lg");
	const foundationVariant = $derived(variant === "secondary" ? "secondary" : "primary");
</script>

<Button
	{href}
	{type}
	{loading}
	variant={foundationVariant}
	size={foundationSize}
	class={cn(
		"group motion-safe:duration-editorial motion-safe:ease-standard relative overflow-hidden rounded-full text-center uppercase motion-safe:transition-[background-color,color,opacity]",
		variant === "primary" &&
			"bg-signal text-background hover:text-primary-hover-foreground motion-safe:duration-editorial motion-safe:ease-interaction",
		variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
		variant === "compact" &&
			"bg-signal text-background hover:text-primary-hover-foreground motion-safe:duration-editorial motion-safe:ease-interaction",
		className
	)}
	{...rest}
>
	{#if dot}
		<span
			data-cta-dot
			aria-hidden="true"
			class="bg-background relative z-[2] size-2 shrink-0 rounded-full motion-safe:animate-[ctaPulse_var(--motion-cta-pulse)_var(--ease)_infinite]"
		></span>
	{/if}
	<span class="relative z-[2]">{@render children()}</span>
	{#if arrow}
		<span aria-hidden="true" class="relative z-[2] inline-flex items-center">
			<ArrowUpRight data-icon="inline-end" strokeWidth={2.25} />
		</span>
	{/if}
</Button>
