<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { cn, revealFocusedElement, type WithoutChildrenOrChild } from "../../utils";
	import PopoverPortal from "./popover-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		align = "center",
		portalProps,
		...restProps
	}: PopoverPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();
</script>

<PopoverPortal {...portalProps}>
	<PopoverPrimitive.Content
		bind:ref
		data-slot="popover-content"
		{sideOffset}
		{align}
		class={cn(
			"surface-overlay text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 text-label motion-safe:duration-base motion-safe:ease-standard z-50 flex max-h-(--bits-popover-content-available-height) w-72 max-w-(--bits-popover-content-available-width) origin-(--transform-origin) flex-col gap-2.5 overflow-y-auto overscroll-contain rounded-lg p-2.5 wrap-anywhere shadow-md [&>*]:shrink-0",
			className
		)}
		{...restProps}
		onfocusin={revealFocusedElement}
	/>
</PopoverPortal>
