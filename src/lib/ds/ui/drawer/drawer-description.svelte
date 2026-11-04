<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { cn } from "../../utils";
	import type { Snippet } from "svelte";

	let {
		class: className,
		children,
		...restProps
	}: DrawerPrimitive.DescriptionProps & { children?: Snippet } = $props();
</script>

<DrawerPrimitive.Description
	data-slot="drawer-description"
	class={cn("text-muted-foreground text-label", className)}
	{...restProps}
>
	{@render children?.()}
</DrawerPrimitive.Description>
