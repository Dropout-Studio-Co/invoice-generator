<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { cn, type WithoutChildrenOrChild } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
	bind:ref
	data-slot="select-scroll-down-button"
	class={cn(
		"surface-3 text-foreground z-10 flex min-h-11 cursor-default items-center justify-center py-2 forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	<ChevronDownIcon />
</SelectPrimitive.ScrollDownButton>
