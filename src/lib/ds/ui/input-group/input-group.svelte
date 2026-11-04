<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...props
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="input-group"
	role="group"
	class={cn(
		"group/input-group surface-control has-[[data-slot=input-group-control]:focus-visible]:!bg-focus-surface has-[[data-slot=input-group-control]:focus-visible]:!text-focus-foreground has-[[data-slot][aria-invalid=true]]:bg-destructive/20 has-disabled:bg-disabled-background has-disabled:text-disabled-foreground rounded-control duration-fast ease-standard relative flex min-h-11 w-full min-w-0 items-center transition-colors has-disabled:opacity-100 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto motion-reduce:transition-none forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pe-1.5 has-[>[data-align=inline-start]]:[&>input]:ps-1.5",
		className
	)}
	{...props}
>
	{@render children?.()}
</div>
