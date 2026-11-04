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
	data-slot="alert-title"
	class={cn(
		"[&_a]:hover:text-foreground min-w-0 font-medium wrap-anywhere group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
