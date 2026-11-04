<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import CheckIcon from "@lucide/svelte/icons/check";
	import { cn, type WithoutChild } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		children: childrenProp,
		...restProps
	}: WithoutChild<ContextMenuPrimitive.RadioItemProps> & {
		inset?: boolean;
	} = $props();
</script>

<ContextMenuPrimitive.RadioItem
	bind:ref
	data-slot="context-menu-radio-item"
	data-inset={inset}
	class={cn(
		"focus:surface-control-hover focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! focus:text-accent-foreground rounded-choice text-label data-disabled:text-disabled-foreground relative flex min-h-8 cursor-default items-center gap-1.5 py-1 ps-1.5 pe-8 select-none data-disabled:pointer-events-none data-disabled:opacity-100 data-inset:ps-7 pointer-coarse:min-h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<span class="pointer-events-none absolute end-2">
			{#if checked}
				<CheckIcon />
			{/if}
		</span>
		{@render childrenProp?.({ checked })}
	{/snippet}
</ContextMenuPrimitive.RadioItem>
