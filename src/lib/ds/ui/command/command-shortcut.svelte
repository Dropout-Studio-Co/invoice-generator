<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
	bind:this={ref}
	data-slot="command-shortcut"
	class={cn(
		"text-muted-foreground group-data-selected/command-item:text-foreground text-caption ms-auto tracking-widest",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
