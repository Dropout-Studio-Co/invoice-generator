<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import CheckIcon from "@lucide/svelte/icons/check";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import { cn, type WithoutChildrenOrChild } from "../../utils";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"surface-control data-checked:bg-signal data-checked:text-background aria-invalid:bg-destructive/20 peer rounded-choice motion-safe:duration-fast motion-safe:ease-standard group-has-disabled/field:text-disabled-foreground group-has-disabled/field:bg-disabled-background disabled:text-disabled-foreground disabled:bg-disabled-background focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! relative flex size-5 shrink-0 items-center justify-center after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-100 motion-safe:transition-colors motion-reduce:transition-none pointer-coarse:min-h-11 pointer-coarse:min-w-11",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="grid place-content-center text-current transition-none [&>svg]:size-3.5"
		>
			{#if checked}
				<CheckIcon />
			{:else if indeterminate}
				<MinusIcon />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
