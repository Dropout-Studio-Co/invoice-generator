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
	class={cn("flex-1 rounded-none bg-transparent disabled:bg-transparent", className)}
	bind:value
	{...props}
	data-slot="input-group-control"
/>
