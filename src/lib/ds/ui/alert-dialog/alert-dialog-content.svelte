<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { cn, type WithoutChild, type WithoutChildrenOrChild } from "../../utils";
	import AlertDialogOverlay from "./alert-dialog-overlay.svelte";
	import AlertDialogPortal from "./alert-dialog-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		size = "default",
		portalProps,
		...restProps
	}: WithoutChild<AlertDialogPrimitive.ContentProps> & {
		size?: "default" | "sm";
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof AlertDialogPortal>>;
	} = $props();
</script>

<AlertDialogPortal {...portalProps}>
	<AlertDialogOverlay />
	<AlertDialogPrimitive.Content
		bind:ref
		data-slot="alert-dialog-content"
		data-size={size}
		class={cn(
			"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 surface-modal text-popover-foreground group/alert-dialog-content text-label motion-safe:duration-base motion-safe:ease-standard fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto overscroll-contain rounded-lg p-4 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm",
			className
		)}
		{...restProps}
	/>
</AlertDialogPortal>
