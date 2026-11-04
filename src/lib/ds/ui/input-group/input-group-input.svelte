<script lang="ts">
	import { Input } from "../input/index.js";
	import { cn } from "../../utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...props
	}: ComponentProps<typeof Input> = $props();
</script>

<Input
	bind:ref
	data-slot="input-group-control"
	class={cn(
		"focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! flex-1 rounded-none bg-transparent disabled:bg-transparent forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
		className
	)}
	bind:value
	{...props}
/>
