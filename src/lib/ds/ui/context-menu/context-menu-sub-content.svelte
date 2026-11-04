<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let { ref = $bindable(null), class: className, ...restProps }: ContextMenuPrimitive.SubContentProps = $props();
</script>

<ContextMenuPrimitive.SubContent
	bind:ref
	data-slot="context-menu-sub-content"
	class={cn(
		"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 surface-overlay text-popover-foreground motion-safe:duration-base motion-safe:ease-standard z-50 min-w-32 origin-(--bits-context-menu-content-transform-origin) overflow-hidden rounded-lg p-1 shadow-lg",
		className
	)}
	{...restProps}
/>
