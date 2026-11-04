<script lang="ts" module>
	import { type VariantProps } from "tailwind-variants";
	import { tv } from "../../tv";

	export const alertVariants = tv({
		base: "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-0.5 rounded-lg px-2.5 py-2 text-start text-label has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_minmax(0,1fr)] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 group/alert relative w-full",
		variants: {
			variant: {
				default: "surface-context text-card-foreground",
				destructive:
					"text-destructive surface-context *:data-[slot=alert-description]:text-destructive *:[svg]:text-current"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});

	export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div bind:this={ref} data-slot="alert" role="alert" class={cn(alertVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</div>
