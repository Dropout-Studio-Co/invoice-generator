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
	data-slot="dropdown-menu-shortcut"
	class={cn(
		"text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground text-caption ms-auto tracking-widest",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
