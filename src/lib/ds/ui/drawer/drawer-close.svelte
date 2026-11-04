<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import type { Snippet } from "svelte";

	let { children, ...restProps }: DrawerPrimitive.CloseProps & { children?: Snippet } = $props();
</script>

<DrawerPrimitive.Close data-slot="drawer-close" {...restProps}>
	{@render children?.()}
</DrawerPrimitive.Close>
