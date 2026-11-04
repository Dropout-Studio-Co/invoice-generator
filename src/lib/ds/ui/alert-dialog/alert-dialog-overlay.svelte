<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let { ref = $bindable(null), class: className, ...restProps }: AlertDialogPrimitive.OverlayProps = $props();
</script>

<AlertDialogPrimitive.Overlay
	bind:ref
	data-slot="alert-dialog-overlay"
	class={cn(
		"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-scrim-soft motion-safe:duration-base motion-safe:ease-standard fixed inset-0 z-50 supports-backdrop-filter:backdrop-blur-xs",
		className
	)}
	{...restProps}
/>
