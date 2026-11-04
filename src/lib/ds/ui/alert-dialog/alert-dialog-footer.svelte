<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert-dialog-footer"
	class={cn("surface-context -mx-4 -mb-4 flex flex-wrap justify-end gap-2 rounded-b-lg p-4", className)}
	{...restProps}
>
	{@render children?.()}
</div>
