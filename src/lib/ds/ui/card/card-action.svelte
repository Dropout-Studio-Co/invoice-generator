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
	data-slot="card-action"
	class={cn(
		"max-w-full min-w-0 self-start wrap-anywhere @min-[28rem]/card:col-start-2 @min-[28rem]/card:row-span-2 @min-[28rem]/card:row-start-1 @min-[28rem]/card:justify-self-end",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
