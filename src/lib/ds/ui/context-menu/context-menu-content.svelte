<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "../../utils";
	import type { WithoutChildrenOrChild } from "../../utils";
	import ContextMenuPortal from "./context-menu-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		portalProps,
		class: className,
		...restProps
	}: ContextMenuPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof ContextMenuPortal>>;
	} = $props();
</script>

<ContextMenuPortal {...portalProps}>
	<ContextMenuPrimitive.Content
		bind:ref
		data-slot="context-menu-content"
		class={cn(
			"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 surface-overlay text-popover-foreground motion-safe:duration-base motion-safe:ease-standard z-50 max-h-(--bits-context-menu-content-available-height) max-w-(--bits-context-menu-content-available-width) min-w-[min(9rem,var(--bits-context-menu-content-available-width))] origin-(--bits-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 wrap-anywhere shadow-md",
			className
		)}
		{...restProps}
	/>
</ContextMenuPortal>
