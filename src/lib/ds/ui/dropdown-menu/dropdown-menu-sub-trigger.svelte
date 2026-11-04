<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { cn } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		children,
		...restProps
	}: DropdownMenuPrimitive.SubTriggerProps & {
		inset?: boolean;
	} = $props();
</script>

<DropdownMenuPrimitive.SubTrigger
	bind:ref
	data-slot="dropdown-menu-sub-trigger"
	data-inset={inset}
	class={cn(
		"focus:surface-control-hover focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! focus:text-accent-foreground data-open:surface-control-hover data-open:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground rounded-choice text-label flex min-h-8 cursor-default items-center gap-1.5 px-1.5 py-1 select-none data-inset:ps-7 pointer-coarse:min-h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronRightIcon class="cn-rtl-flip ms-auto" />
</DropdownMenuPrimitive.SubTrigger>
