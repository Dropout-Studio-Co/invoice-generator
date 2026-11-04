<script lang="ts" module>
	import { type VariantProps } from "tailwind-variants";
	import { tv } from "../../tv";

	export const badgeVariants = tv({
		base: "min-h-6 gap-1 rounded-full px-2 text-caption font-medium motion-safe:transition-[background-color,color,opacity] motion-safe:duration-fast motion-safe:ease-standard has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! group/badge inline-flex w-fit min-w-0 max-w-full items-center justify-center py-0.5 whitespace-normal wrap-anywhere focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! aria-invalid:bg-destructive/20 [&>svg]:pointer-events-none [&>svg]:shrink-0",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				destructive: "bg-destructive/20 [a]:hover:bg-destructive/30 text-destructive",
				outline: "surface-control text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "../../utils";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
