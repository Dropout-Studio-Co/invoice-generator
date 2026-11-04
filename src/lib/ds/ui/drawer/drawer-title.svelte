<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { cn } from "../../utils";
	import type { Snippet } from "svelte";

	let { class: className, children, ...restProps }: DrawerPrimitive.TitleProps & { children?: Snippet } = $props();
</script>

<DrawerPrimitive.Title
	data-slot="drawer-title"
	class={cn("text-foreground text-base font-medium", className)}
	{...restProps}
>
	{@render children?.()}
</DrawerPrimitive.Title>
