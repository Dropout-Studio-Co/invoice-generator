<script lang="ts" module>
	import { type VariantProps } from "tailwind-variants";
	import { tv } from "../../tv";
	export const inputGroupAddonVariants = tv({
		base: "text-muted-foreground min-h-11 h-auto gap-2 px-3 py-2 text-label font-medium group-data-[disabled=true]/input-group:text-disabled-foreground group-data-[disabled=true]/input-group:opacity-100 [&>kbd]:rounded-choice [&>svg:not([class*='size-'])]:size-4 flex cursor-text items-center justify-center select-none",
		variants: {
			align: {
				"inline-start": "ps-2 has-[>button]:ms-[-0.3rem] has-[>kbd]:ms-[-0.15rem] order-first",
				"inline-end": "pe-2 has-[>button]:me-[-0.3rem] has-[>kbd]:me-[-0.15rem] order-last",
				"block-start": "px-3 pt-2 group-has-[>input]/input-group:pt-2 order-first w-full justify-start",
				"block-end": "px-3 pb-2 group-has-[>input]/input-group:pb-2 order-last w-full justify-start"
			}
		},
		defaultVariants: {
			align: "inline-start"
		}
	});

	export type InputGroupAddonAlign = VariantProps<typeof inputGroupAddonVariants>["align"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		align = "inline-start",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		align?: InputGroupAddonAlign;
	} = $props();
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="input-group-addon"
	data-align={align}
	class={cn(inputGroupAddonVariants({ align }), className)}
	onclick={e => {
		if ((e.target as HTMLElement).closest("button")) {
			return;
		}
		e.currentTarget.parentElement?.querySelector("input")?.focus();
	}}
	{...restProps}
>
	{@render children?.()}
</div>
