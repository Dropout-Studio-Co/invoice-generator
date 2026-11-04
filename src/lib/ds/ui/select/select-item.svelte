<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import CheckIcon from "@lucide/svelte/icons/check";
	import { cn, type WithoutChild } from "../../utils";

	type SelectItemProps = Omit<WithoutChild<SelectPrimitive.ItemProps>, "value" | "label" | "ref"> & {
		value: string;
		label?: string | undefined;
	};

	let { class: className, value, label, children: childrenProp, ...restProps }: SelectItemProps = $props();
</script>

<SelectPrimitive.Item
	{value}
	{...label !== undefined ? { label } : {}}
	data-slot="select-item"
	class={cn(
		"text-muted-foreground data-highlighted:surface-control-hover data-highlighted:text-foreground focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! data-[state=checked]:text-foreground data-selected:bg-signal/25! rounded-choice text-label duration-fast ease-standard data-disabled:text-disabled-foreground relative flex min-h-11 w-full cursor-default items-center gap-2 px-2.5 py-2.5 pe-8 transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-100 data-selected:duration-0 forced-colors:text-[CanvasText] forced-colors:data-highlighted:bg-[Highlight] forced-colors:data-highlighted:text-[HighlightText] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
		className
	)}
	{...restProps}
>
	{#snippet children({ selected, highlighted })}
		<span class="pointer-events-none absolute end-2 flex size-4 items-center justify-center">
			{#if selected}
				<CheckIcon class="pointer-events-none" />
			{/if}
		</span>
		<span class="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
			{#if childrenProp}
				{@render childrenProp({ selected, highlighted })}
			{:else}
				{label || value}
			{/if}
		</span>
	{/snippet}
</SelectPrimitive.Item>
