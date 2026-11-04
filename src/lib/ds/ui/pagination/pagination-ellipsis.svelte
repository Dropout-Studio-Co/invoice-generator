<script lang="ts">
	import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
	import { cn, type WithElementRef, type WithoutChildren } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		label = "More pages",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & { label?: string } = $props();
</script>

<span
	bind:this={ref}
	role="img"
	aria-label={label}
	data-slot="pagination-ellipsis"
	class={cn(
		"flex size-9 items-center justify-center pointer-coarse:size-11 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	<MoreHorizontalIcon aria-hidden="true" />
</span>
