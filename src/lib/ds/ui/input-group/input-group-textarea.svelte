<script lang="ts">
	import { Textarea } from "../textarea/index.js";
	import { cn } from "../../utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...props
	}: ComponentProps<typeof Textarea> = $props();
</script>

<Textarea
	bind:ref
	data-slot="input-group-control"
	class={cn(
		"focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! flex-1 resize-none rounded-none bg-transparent py-2 disabled:bg-transparent forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
		className
	)}
	bind:value
	{...props}
/>
