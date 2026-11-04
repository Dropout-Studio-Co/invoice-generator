<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from "bits-ui";
	import CircleIcon from "@lucide/svelte/icons/circle";
	import { cn, type WithoutChildrenOrChild } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<RadioGroupPrimitive.ItemProps> = $props();
</script>

<RadioGroupPrimitive.Item
	bind:ref
	data-slot="radio-group-item"
	class={cn(
		"surface-control data-checked:bg-signal data-checked:text-background aria-invalid:bg-destructive/20 group/radio-group-item peer disabled:text-disabled-foreground disabled:bg-disabled-background focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! relative flex aspect-square size-5 shrink-0 rounded-full after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-100 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked })}
		<div data-slot="radio-group-indicator" class="flex size-4 items-center justify-center">
			{#if checked}
				<CircleIcon
					class="bg-background absolute start-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full rtl:translate-x-1/2 forced-colors:bg-[CanvasText]"
				/>
			{/if}
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
