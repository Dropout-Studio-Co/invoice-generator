<script lang="ts">
	import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
	import { cn, type WithElementRef, type WithoutChildren } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		label = "More breadcrumbs",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> & { label?: string } = $props();
</script>

<span
	bind:this={ref}
	data-slot="breadcrumb-ellipsis"
	role="img"
	aria-label={label}
	class={cn("flex size-5 items-center justify-center [&>svg]:size-4", className)}
	{...restProps}
>
	<MoreHorizontalIcon aria-hidden="true" />
	<span aria-hidden="true">{label}</span>
</span>
