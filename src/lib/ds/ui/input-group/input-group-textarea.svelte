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
	class={cn("flex-1 resize-none rounded-none bg-transparent py-2 disabled:bg-transparent", className)}
	bind:value
	{...props}
	data-slot="input-group-control"
/>
