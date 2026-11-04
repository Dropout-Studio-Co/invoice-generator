<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		"hover:surface-control-hover data-[state=selected]:surface-control-hover has-aria-expanded:surface-control-hover motion-safe:duration-fast motion-safe:ease-standard motion-safe:transition-colors",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
