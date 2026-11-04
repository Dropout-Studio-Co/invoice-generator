<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { tick, type Snippet } from "svelte";

	let {
		shouldScaleBackground = true,
		open = $bindable(false),
		activeSnapPoint = $bindable(null),
		closeFocus,
		onOpenChange,
		children,
		...restProps
	}: DrawerPrimitive.Props & { children?: Snippet } = $props();

	let opener = $state<HTMLElement | null>(null);
	/** Vaul closes outside Melt's handleClose; restore only after the focus trap deactivates. */
	const handleOpenChange = (next: boolean) => {
		if (next && document.activeElement instanceof HTMLElement) opener = document.activeElement;
		onOpenChange?.(next);
		if (!next)
			void tick().then(() => {
				if (open) return;
				const target =
					closeFocus === undefined
						? opener
						: typeof closeFocus === "function"
							? closeFocus(opener)
							: closeFocus;
				const element = typeof target === "string" ? document.querySelector(target) : target;
				if ((element instanceof HTMLElement || element instanceof SVGElement) && element.isConnected)
					element.focus();
			});
	};
</script>

<DrawerPrimitive.Root
	{shouldScaleBackground}
	bind:open
	bind:activeSnapPoint
	{closeFocus}
	onOpenChange={handleOpenChange}
	{...restProps}
>
	{@render children?.()}
</DrawerPrimitive.Root>
