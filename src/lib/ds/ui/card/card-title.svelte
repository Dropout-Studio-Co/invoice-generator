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
	data-slot="card-title"
	class={cn(
		"group-data-[size=sm]/card:text-label min-w-0 text-base leading-snug font-medium wrap-anywhere",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
