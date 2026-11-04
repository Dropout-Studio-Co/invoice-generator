<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn } from "../../utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComponentProps<typeof SelectPrimitive.GroupHeading> = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	data-slot="select-group-heading"
	class={cn("text-muted-foreground text-caption px-2 py-2", className)}
	{...restProps}
>
	{@render children?.()}
</SelectPrimitive.GroupHeading>
