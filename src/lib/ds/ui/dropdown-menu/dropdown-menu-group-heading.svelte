<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "../../utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		...restProps
	}: ComponentProps<typeof DropdownMenuPrimitive.GroupHeading> & {
		inset?: boolean;
	} = $props();
</script>

<DropdownMenuPrimitive.GroupHeading
	bind:ref
	data-slot="dropdown-menu-group-heading"
	data-inset={inset}
	class={cn("text-muted-foreground text-caption px-1.5 py-1 font-medium data-inset:ps-7", className)}
	{...restProps}
/>
