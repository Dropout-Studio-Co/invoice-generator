<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let { ref = $bindable(null), class: className, ...restProps }: ContextMenuPrimitive.SeparatorProps = $props();
</script>

<ContextMenuPrimitive.Separator
	bind:ref
	data-slot="context-menu-separator"
	class={cn("-mx-1 my-1 h-2", className)}
	{...restProps}
/>
