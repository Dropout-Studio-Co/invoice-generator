<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { cn, type WithoutChild } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: "sm" | "default";
	} = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	class={cn(
		"surface-control data-placeholder:text-muted-foreground aria-invalid:bg-destructive/20 rounded-control text-label duration-fast ease-standard data-[size=sm]:rounded-choice focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! flex min-h-11 w-full min-w-36 items-center justify-between gap-2 px-3 whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed data-[size=sm]:min-h-10 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 motion-reduce:transition-none forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="text-muted-foreground pointer-events-none size-4" />
</SelectPrimitive.Trigger>
