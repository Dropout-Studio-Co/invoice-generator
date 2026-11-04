<script lang="ts">
	import { Separator as SeparatorPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		"data-slot": dataSlot = "separator",
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<SeparatorPrimitive.Root
	bind:ref
	data-slot={dataSlot}
	class={cn(
		"shrink-0 data-horizontal:h-2 data-horizontal:w-full data-vertical:w-2 data-vertical:self-stretch",
		className
	)}
	{...restProps}
/>
