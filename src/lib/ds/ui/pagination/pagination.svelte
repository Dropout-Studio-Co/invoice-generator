<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		count = 0,
		perPage = 10,
		page = $bindable(1),
		siblingCount = 1,
		ariaLabel = "Pagination",
		...restProps
	}: PaginationPrimitive.RootProps & { ariaLabel?: string } = $props();

	const rootProps = $derived({ ...restProps, "aria-label": ariaLabel });
</script>

<PaginationPrimitive.Root
	bind:ref
	bind:page
	role="navigation"
	data-slot="pagination"
	{count}
	{perPage}
	{siblingCount}
	class={cn("mx-auto flex w-full justify-center", className)}
	{...rootProps}
/>
