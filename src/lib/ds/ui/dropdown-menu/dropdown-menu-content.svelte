<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "../../utils";
	import DropdownMenuPortal from "./dropdown-menu-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		sideOffset = 4,
		align = "start",
		portalProps,
		class: className,
		...restProps
	}: DropdownMenuPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
	} = $props();
</script>

<DropdownMenuPortal {...portalProps}>
	<DropdownMenuPrimitive.Content
		bind:ref
		data-slot="dropdown-menu-content"
		{sideOffset}
		{align}
		class={cn(
			"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 surface-overlay text-popover-foreground motion-safe:duration-base motion-safe:ease-standard z-50 max-h-(--bits-dropdown-menu-content-available-height) w-(--bits-dropdown-menu-anchor-width) max-w-(--bits-dropdown-menu-content-available-width) min-w-[min(8rem,var(--bits-dropdown-menu-content-available-width))] origin-(--bits-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 wrap-anywhere shadow-md data-closed:overflow-hidden",
			className
		)}
		{...restProps}
	/>
</DropdownMenuPortal>
