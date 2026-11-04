<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLTableAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> = $props();
</script>

<div data-slot="table-container" class="surface-context relative w-full overflow-x-auto">
	<table bind:this={ref} data-slot="table" class={cn("text-label w-full caption-bottom", className)} {...restProps}>
		{@render children?.()}
	</table>
</div>
