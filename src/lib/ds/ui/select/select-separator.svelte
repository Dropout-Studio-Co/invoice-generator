<script lang="ts">
	import { Separator } from "../separator/index.js";
	import { cn } from "../../utils";
	import type { Separator as SeparatorPrimitive } from "bits-ui";

	let { ref = $bindable(null), class: className, ...restProps }: SeparatorPrimitive.RootProps = $props();
</script>

<Separator
	bind:ref
	data-slot="select-separator"
	class={cn("pointer-events-none -mx-1 my-1 h-2", className)}
	{...restProps}
/>
