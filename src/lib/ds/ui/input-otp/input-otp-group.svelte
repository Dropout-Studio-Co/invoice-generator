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
	data-slot="input-otp-group"
	class={cn(
		"has-aria-invalid:bg-destructive/20 rounded-control flex items-center motion-reduce:transition-none",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
