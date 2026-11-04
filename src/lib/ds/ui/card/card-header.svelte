<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
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
	data-slot="card-header"
	class={cn(
		"group/card-header @container/card-header grid min-w-0 auto-rows-min grid-cols-[minmax(0,1fr)] items-start gap-1 rounded-t-lg px-(--card-spacing) has-data-[slot=card-description]:grid-rows-[auto_auto] @min-[28rem]/card:has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto]",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
