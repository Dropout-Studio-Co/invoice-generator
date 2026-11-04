<script lang="ts" module>
	import { type VariantProps } from "tailwind-variants";
	import { tv } from "../../tv";

	const inputGroupButtonVariants = tv({
		base: "min-h-9 gap-2 text-label flex items-center shadow-none motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-standard motion-reduce:transition-none pointer-coarse:min-h-11",
		variants: {
			size: {
				xs: "h-9 gap-1 rounded-choice px-2 pointer-coarse:min-h-11 [&>svg:not([class*='size-'])]:size-4",
				sm: "",
				"icon-xs": "size-9 rounded-choice p-0 pointer-coarse:min-h-11 pointer-coarse:min-w-11 has-[>svg]:p-0",
				"icon-sm": "size-9 rounded-choice p-0 pointer-coarse:min-h-11 pointer-coarse:min-w-11 has-[>svg]:p-0"
			}
		},
		defaultVariants: {
			size: "xs"
		}
	});

	export type InputGroupButtonSize = VariantProps<typeof inputGroupButtonVariants>["size"];
</script>

<script lang="ts">
	import { Button } from "../button/index.js";
	import { cn } from "../../utils";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		type = "button",
		variant = "ghost",
		size = "xs",
		...restProps
	}: Omit<ComponentProps<typeof Button>, "href" | "size"> & {
		size?: InputGroupButtonSize;
	} = $props();
</script>

<Button
	bind:ref
	{type}
	data-size={size}
	{variant}
	class={cn(inputGroupButtonVariants({ size }), className)}
	{...restProps}
>
	{@render children?.()}
</Button>
