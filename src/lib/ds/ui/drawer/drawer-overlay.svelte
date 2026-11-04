<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { cn } from "../../utils";

	let { class: className, ...restProps }: DrawerPrimitive.OverlayProps = $props();
</script>

<DrawerPrimitive.Overlay
	data-slot="drawer-overlay"
	class={cn(
		"bg-scrim-soft data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-safe:duration-base motion-safe:ease-standard fixed inset-0 z-50 supports-backdrop-filter:backdrop-blur-xs",
		className
	)}
	{...restProps}
/>
