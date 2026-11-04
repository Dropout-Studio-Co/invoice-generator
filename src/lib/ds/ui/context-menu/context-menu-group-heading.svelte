<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		inset,
		...restProps
	}: ContextMenuPrimitive.GroupHeadingProps & {
		inset?: boolean;
	} = $props();
</script>

<ContextMenuPrimitive.GroupHeading
	bind:ref
	data-slot="context-menu-group-heading"
	data-inset={inset}
	class={cn("text-muted-foreground text-caption px-1.5 py-1 font-medium data-inset:ps-7", className)}
	{...restProps}
/>
