<script lang="ts">
	import MinusIcon from "@lucide/svelte/icons/minus";
	import type { WithElementRef } from "../../utils";
	import { cn } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="input-otp-separator"
	role="separator"
	class={cn(
		"flex min-h-10 items-center motion-reduce:transition-none [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<MinusIcon />
	{/if}
</div>
