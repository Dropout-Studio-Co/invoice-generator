<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { cn, type WithoutChild } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		children,
		...restProps
	}: WithoutChild<ContextMenuPrimitive.SubTriggerProps> & {
		inset?: boolean;
	} = $props();
</script>

<ContextMenuPrimitive.SubTrigger
	bind:ref
	data-slot="context-menu-sub-trigger"
	data-inset={inset}
	class={cn(
		"focus:surface-control-hover focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! focus:text-accent-foreground data-open:surface-control-hover data-open:text-accent-foreground rounded-choice text-label flex min-h-8 cursor-default items-center gap-1.5 px-1.5 py-1 select-none data-inset:ps-7 pointer-coarse:min-h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronRightIcon class="cn-rtl-flip ms-auto" />
</ContextMenuPrimitive.SubTrigger>
