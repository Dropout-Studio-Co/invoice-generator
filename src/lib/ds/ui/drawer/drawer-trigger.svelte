<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	let { children, ...restProps }: DialogPrimitive.TriggerProps & { children?: Snippet } = $props();
</script>

<DrawerPrimitive.Trigger data-slot="drawer-trigger" {...restProps}>
	{@render children?.()}
</DrawerPrimitive.Trigger>
