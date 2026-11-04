<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	let { children, ...restProps }: DialogPrimitive.PortalProps & { children?: Snippet } = $props();
</script>

<DrawerPrimitive.Portal {...restProps}>
	{@render children?.()}
</DrawerPrimitive.Portal>
