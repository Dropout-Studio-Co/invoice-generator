<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import { buttonVariants } from "../button/index.js";
	import { cn } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		label = "Previous",
		ariaLabel = "Go to previous page",
		...restProps
	}: PaginationPrimitive.PrevButtonProps & { label?: string; ariaLabel?: string } = $props();
</script>

<PaginationPrimitive.PrevButton
	bind:ref
	aria-label={ariaLabel}
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "ps-1.5! pointer-coarse:min-w-11", className)}
	{...restProps}
>
	<ChevronLeftIcon data-icon="inline-start" class="cn-rtl-flip" />
	<span class="hidden sm:block">{label}</span>
</PaginationPrimitive.PrevButton>
