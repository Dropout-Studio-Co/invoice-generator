<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { buttonVariants } from "../button/index.js";
	import { cn } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		label = "Next",
		ariaLabel = "Go to next page",
		...restProps
	}: PaginationPrimitive.NextButtonProps & { label?: string; ariaLabel?: string } = $props();
</script>

<PaginationPrimitive.NextButton
	bind:ref
	aria-label={ariaLabel}
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "pe-1.5! pointer-coarse:min-w-11", className)}
	{...restProps}
>
	<span class="hidden sm:block">{label}</span>
	<ChevronRightIcon data-icon="inline-end" class="cn-rtl-flip" />
</PaginationPrimitive.NextButton>
