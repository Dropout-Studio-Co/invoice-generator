<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLOlAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLOlAttributes> = $props();
</script>

<ol
	bind:this={ref}
	data-slot="breadcrumb-list"
	class={cn("text-muted-foreground text-label flex flex-wrap items-center gap-1.5 wrap-break-word", className)}
	{...restProps}
>
	{@render children?.()}
</ol>
